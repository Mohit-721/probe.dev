// Probe runner: executes a monitor's steps, evaluates assertions, persists a run.
// Used by both the API route (manual / scheduled) and any future workflow.

import type { SupabaseClient } from "@supabase/supabase-js"
import type { Assertion, AssertionResult, Monitor, MonitorStep, RunStatus, StepResult } from "@/lib/types"
import { nextRunAt } from "@/lib/cron"
import { safeFetch, SsrfError } from "@/lib/safe-fetch"

function getJsonPath(obj: unknown, path: string): unknown {
  if (!path) return obj
  const parts = path.split(".").filter(Boolean)
  let cur: unknown = obj
  for (const p of parts) {
    if (cur && typeof cur === "object" && p in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[p]
    } else {
      return undefined
    }
  }
  return cur
}

function evaluateAssertion(
  a: Assertion,
  ctx: { statusCode: number; durationMs: number; headers: Headers; body: unknown },
): AssertionResult {
  switch (a.kind) {
    case "status": {
      const expected = a.value
      const actual = ctx.statusCode
      const ok =
        a.op === "eq"
          ? actual === expected
          : a.op === "neq"
            ? actual !== expected
            : a.op === "lt"
              ? actual < expected
              : actual > expected
      return { name: `status ${a.op} ${expected}`, ok, expected, actual }
    }
    case "duration_ms": {
      const ok = a.op === "lt" ? ctx.durationMs < a.value : ctx.durationMs <= a.value
      return { name: `duration_ms ${a.op} ${a.value}`, ok, expected: a.value, actual: ctx.durationMs }
    }
    case "header": {
      const actual = ctx.headers.get(a.name)
      const ok =
        a.op === "exists"
          ? actual != null
          : a.op === "eq"
            ? actual === a.value
            : (actual ?? "").includes(a.value ?? "")
      return { name: `header ${a.name} ${a.op}`, ok, expected: a.value, actual }
    }
    case "body": {
      const actual = getJsonPath(ctx.body, a.jsonPath)
      let ok = false
      switch (a.op) {
        case "eq":
          ok = actual === a.value
          break
        case "neq":
          ok = actual !== a.value
          break
        case "exists":
          ok = actual !== undefined
          break
        case "type":
          ok = typeof actual === a.value
          break
        case "contains":
          ok = typeof actual === "string" && typeof a.value === "string" && actual.includes(a.value)
          break
      }
      return { name: `body ${a.jsonPath} ${a.op}${a.value !== undefined ? " " + JSON.stringify(a.value) : ""}`, ok, expected: a.value, actual }
    }
  }
}

async function executeStep(step: MonitorStep): Promise<StepResult> {
  const start = performance.now()
  let statusCode: number | null = null
  let durationMs = 0
  let assertions: AssertionResult[] = []
  let errorMessage: string | undefined

  try {
    const res = await safeFetch(step.url, {
      method: step.method,
      headers: step.headers,
      body: step.method === "GET" || step.method === "HEAD" ? undefined : step.body,
      timeoutMs: 30_000,
      maxBytes: 2 * 1024 * 1024, // 2 MiB hard cap
      maxRedirects: 0, // explicit: do not auto-follow (each hop must be re-validated)
    })
    durationMs = Math.round(performance.now() - start)
    statusCode = res.status

    const contentType = res.headers.get("content-type") ?? ""
    let body: unknown = null
    if (contentType.includes("application/json")) {
      try {
        body = JSON.parse(res.body)
      } catch {
        body = null
      }
    } else {
      body = res.body
    }

    assertions = step.assertions.map((a) =>
      evaluateAssertion(a, { statusCode: res.status, durationMs, headers: res.headers, body }),
    )
  } catch (err) {
    durationMs = Math.round(performance.now() - start)
    errorMessage =
      err instanceof SsrfError
        ? `Refused: ${err.message}`
        : err instanceof Error
          ? err.message
          : "Unknown error"
    assertions = step.assertions.map((a) => ({
      name: a.kind,
      ok: false,
      expected: "request to succeed",
      actual: errorMessage,
    }))
  }

  const allOk = assertions.length > 0 && assertions.every((a) => a.ok)

  return {
    step: step.name,
    status: allOk ? "success" : "failed",
    status_code: statusCode,
    duration_ms: durationMs,
    assertions,
    error: errorMessage,
  }
}

export async function runMonitor(
  supabase: SupabaseClient,
  monitor: Monitor,
  trigger: "manual" | "schedule" | "webhook",
) {
  const startedAt = new Date().toISOString()
  const stepResults: StepResult[] = []

  for (const step of monitor.config.steps ?? []) {
    const r = await executeStep(step)
    stepResults.push(r)
    if (r.status === "failed") break
  }

  const totalDuration = stepResults.reduce((acc, s) => acc + s.duration_ms, 0)
  const status: RunStatus =
    stepResults.length === 0
      ? "failed"
      : stepResults.every((s) => s.status === "success")
        ? "success"
        : "failed"

  const completedAt = new Date().toISOString()

  const { data: run } = await supabase
    .from("runs")
    .insert({
      monitor_id: monitor.id,
      user_id: monitor.user_id,
      status,
      duration_ms: totalDuration,
      step_results: stepResults,
      error_message: stepResults.find((s) => s.error)?.error ?? null,
      trigger,
      started_at: startedAt,
      completed_at: completedAt,
    })
    .select("id")
    .single()

  // Update monitor's denormalized status + reschedule
  const next = nextRunAt(monitor.schedule, new Date()).toISOString()
  await supabase
    .from("monitors")
    .update({
      last_status: status === "success" ? "success" : "failed",
      last_run_at: completedAt,
      next_run_at: next,
      updated_at: completedAt,
    })
    .eq("id", monitor.id)

  // Open an incident on transition to failed (only if no active one)
  if (status === "failed") {
    const { data: existing } = await supabase
      .from("incidents")
      .select("id")
      .eq("monitor_id", monitor.id)
      .eq("status", "open")
      .maybeSingle()

    if (!existing) {
      const failedStep = stepResults.find((s) => s.status === "failed")
      const failedAssertion = failedStep?.assertions?.find((a) => !a.ok)
      await supabase.from("incidents").insert({
        monitor_id: monitor.id,
        user_id: monitor.user_id,
        title: `${monitor.name} failed`,
        summary: failedStep?.error ?? failedAssertion?.name ?? "Assertions failed",
        severity: "major",
        status: "open",
        first_run_id: run?.id ?? null,
      })
    }
  }

  // Resolve any open incident on recovery
  if (status === "success") {
    await supabase
      .from("incidents")
      .update({ status: "resolved", resolved_at: completedAt })
      .eq("monitor_id", monitor.id)
      .eq("status", "open")
  }

  return { runId: run?.id ?? null, status, durationMs: totalDuration, stepResults }
}
