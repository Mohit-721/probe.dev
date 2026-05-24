"use server"

import { randomBytes } from "node:crypto"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { validateUrlForOutbound, SsrfError } from "@/lib/safe-fetch"
import type { MonitorStep, Assertion, HttpMethod } from "@/lib/types"

// Tier limits — keep well within Supabase + Vercel free tiers and prevent abuse.
const MAX_MONITORS_PER_USER = 25

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
}

export async function createMonitor(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const name = String(formData.get("name") ?? "").trim()
  const description = String(formData.get("description") ?? "").trim() || null
  const method = String(formData.get("method") ?? "GET").toUpperCase() as HttpMethod
  const url = String(formData.get("url") ?? "").trim()
  const expectedStatus = Number(formData.get("expected_status") ?? 200)
  const maxDuration = Number(formData.get("max_duration_ms") ?? 5000)
  let headerName = String(formData.get("header_name") ?? "").trim()
  const headerValue = String(formData.get("header_value") ?? "").trim()

  // If user entered a value but forgot/skipped the header name,
  // auto-default to "Authorization" (the most common use case).
  if (!headerName && headerValue) {
    headerName = "Authorization"
  }
  const body = String(formData.get("body") ?? "").trim()
  const schedule = String(formData.get("schedule") ?? "*/5 * * * *").trim()

  if (!name || !url) {
    return { error: "Name and URL are required" }
  }

  // SSRF guard at create time: reject any URL that resolves to a private IP.
  try {
    await validateUrlForOutbound(url)
  } catch (err) {
    if (err instanceof SsrfError) return { error: err.message }
    return { error: "URL is not reachable" }
  }

  // Per-user monitor cap (defense-in-depth + cost control).
  const { count } = await supabase
    .from("monitors")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
  if ((count ?? 0) >= MAX_MONITORS_PER_USER) {
    return { error: `Monitor limit reached (${MAX_MONITORS_PER_USER}). Delete one to add another.` }
  }

  // Reject impossibly tight schedules. We keep parsing minimal — anything below
  // a minute is rejected because Vercel cron itself runs at 1-minute granularity.
  if (!/^\S+(\s+\S+){4,5}$/.test(schedule)) {
    return { error: "Schedule must be a 5- or 6-field cron expression" }
  }

  const slug = slugify(name) || `monitor-${Date.now()}`

  const headers: Record<string, string> = {}
  if (headerName) headers[headerName] = headerValue

  const assertions: Assertion[] = [
    { kind: "status", op: "eq", value: expectedStatus },
    { kind: "duration_ms", op: "lt", value: maxDuration },
  ]

  const step: MonitorStep = {
    name: "request",
    method,
    url,
    headers: Object.keys(headers).length ? headers : undefined,
    body: body && method !== "GET" && method !== "HEAD" ? body : undefined,
    assertions,
  }

  const { data, error } = await supabase
    .from("monitors")
    .insert({
      user_id: user.id,
      name,
      slug,
      description,
      kind: "simple",
      schedule,
      enabled: true,
      last_status: "pending",
      config: { steps: [step] },
    })
    .select("id")
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/monitors")
  redirect(`/dashboard/monitors/${data.id}`)
}

export async function deleteMonitor(monitorId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  // Defense-in-depth: also pin to the caller's user_id, not just RLS.
  const { error } = await supabase
    .from("monitors")
    .delete()
    .eq("id", monitorId)
    .eq("user_id", user.id)
  if (error) return { error: error.message }

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/monitors")
  redirect("/dashboard/monitors")
}

export async function toggleMonitor(monitorId: string, enabled: boolean) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { error } = await supabase
    .from("monitors")
    .update({ enabled })
    .eq("id", monitorId)
    .eq("user_id", user.id)
  if (error) return { error: error.message }

  revalidatePath(`/dashboard/monitors/${monitorId}`)
  revalidatePath("/dashboard/monitors")
}

/**
 * Generate a cryptographically-strong public-status token.
 * 16 bytes → 32 hex chars → 128 bits of entropy.
 */
function randomToken() {
  return randomBytes(16).toString("hex")
}

export async function setMonitorPublic(monitorId: string, makePublic: boolean) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const token = makePublic ? randomToken() : null

  const { error } = await supabase
    .from("monitors")
    .update({ public_token: token })
    .eq("id", monitorId)
    .eq("user_id", user.id)
  if (error) return { error: error.message }

  revalidatePath(`/dashboard/monitors/${monitorId}`)
  return { ok: true, token }
}
