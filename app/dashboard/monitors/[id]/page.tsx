import Link from "next/link"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/dashboard/page-header"
import { StatusPill } from "@/components/dashboard/status-pill"
import { ActivityStrip } from "@/components/dashboard/activity-strip"
import { LatencyChart } from "@/components/dashboard/latency-chart"
import { ShareCard } from "@/components/dashboard/share-card"
import { RunNowButton } from "@/components/dashboard/run-now-button"
import { MonitorActionsMenu } from "@/components/dashboard/monitor-actions-menu"
import { Check, X } from "lucide-react"
import type { Monitor, Run, AssertionResult } from "@/lib/types"
import { cn } from "@/lib/utils"

export default async function MonitorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: monitorRaw } = await supabase.from("monitors").select("*").eq("id", id).maybeSingle()
  if (!monitorRaw) notFound()
  const monitor = monitorRaw as Monitor

  const { data: runsRaw } = await supabase
    .from("runs")
    .select("*")
    .eq("monitor_id", id)
    .order("started_at", { ascending: false })
    .limit(50)
  const runs = (runsRaw ?? []) as Run[]

  const successCount = runs.filter((r) => r.status === "success").length
  const uptime = runs.length > 0 ? (successCount / runs.length) * 100 : 100
  const avgLatency =
    runs.length > 0 ? Math.round(runs.reduce((acc, r) => acc + (r.duration_ms ?? 0), 0) / runs.length) : 0

  const step = monitor.config?.steps?.[0]

  return (
    <>
      <PageHeader
        breadcrumb={
          <span>
            ~ / <Link href="/dashboard/monitors" className="hover:text-foreground">monitors</Link> / {monitor.slug}
          </span>
        }
        title={monitor.name}
        description={monitor.description ?? `Probing ${step?.url ?? "an endpoint"} every ${monitor.schedule}.`}
        actions={
          <div className="flex items-center gap-2">
            <StatusPill status={monitor.last_status} />
            <RunNowButton monitorId={monitor.id} />
            <MonitorActionsMenu monitorId={monitor.id} enabled={monitor.enabled} />
          </div>
        }
      />

      <div className="space-y-6 px-4 py-6 md:px-8 md:py-8">
        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          <Stat label="Uptime" value={`${uptime.toFixed(1)}%`} sub={`last ${runs.length} runs`} />
          <Stat label="Avg latency" value={`${avgLatency}ms`} sub="across recent runs" />
          <Stat label="Schedule" value={monitor.schedule} mono sub={monitor.enabled ? "active" : "paused"} />
          <Stat
            label="Last run"
            value={(() => {
              if (!monitor.last_run_at) return "—"
              const d = new Date(monitor.last_run_at)
              return isNaN(d.getTime()) ? "—" : d.toLocaleTimeString()
            })()}
            sub={(() => {
              if (!monitor.last_run_at) return "no data"
              const d = new Date(monitor.last_run_at)
              return isNaN(d.getTime()) ? "no data" : d.toLocaleDateString()
            })()}
          />
        </div>

        {/* Latency chart */}
        <section className="rounded-xl border border-border bg-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-medium">Latency</h2>
              <p className="text-xs text-muted-foreground">
                Response time across the last {runs.length} runs · failed runs highlighted in red
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-primary shadow-[0_0_6px_var(--primary)]" />
                healthy
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-destructive" />
                failed
              </span>
            </div>
          </div>
          <div className="mt-4">
            <LatencyChart
              points={runs.map((r) => ({
                t: new Date(r.started_at).getTime(),
                ms: r.duration_ms ?? 0,
                status: r.status,
              }))}
            />
          </div>
        </section>

        {/* Recent activity */}
        <section className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-medium">Run history</h2>
              <p className="text-xs text-muted-foreground">Newest on the right · {runs.length} recent runs</p>
            </div>
          </div>
          <div className="mt-4">
            <ActivityStrip runs={runs.slice().reverse().map((r) => ({ status: r.status }))} cells={60} />
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
          {/* Recent runs list */}
          <section className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="border-b border-border px-5 py-3">
              <h2 className="text-sm font-medium">Recent runs</h2>
            </div>
            {runs.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground">
                No runs yet. Click <span className="font-medium text-foreground">Run now</span> to execute the first probe.
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {runs.slice(0, 10).map((r) => {
                  const firstStep = r.step_results?.[0]
                  return (
                    <li key={r.id} className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <StatusPill status={r.status} size="xs" />
                        <span className="font-mono text-xs text-muted-foreground">
                          {firstStep?.status_code ?? "—"} ·{" "}
                          {r.duration_ms != null ? `${r.duration_ms}ms` : "—"}
                        </span>
                        <span className="ml-auto font-mono text-xs text-muted-foreground">
                          {new Date(r.started_at).toLocaleString()}
                        </span>
                      </div>
                      {firstStep?.assertions?.length ? (
                        <ul className="mt-2 grid gap-1 pl-1 sm:grid-cols-2">
                          {firstStep.assertions.map((a: AssertionResult, i: number) => (
                            <li
                              key={i}
                              className={cn(
                                "flex items-center gap-1.5 font-mono text-[11px]",
                                a.ok ? "text-muted-foreground" : "text-destructive",
                              )}
                            >
                              {a.ok ? (
                                <Check className="size-3 shrink-0 text-primary" />
                              ) : (
                                <X className="size-3 shrink-0 text-destructive" />
                              )}
                              <span className="truncate">{a.name}</span>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                      {r.error_message ? (
                        <p className="mt-2 truncate font-mono text-[11px] text-destructive">
                          {r.error_message}
                        </p>
                      ) : null}
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          {/* Config */}
          <aside className="space-y-4">
            <ShareCard
              monitorId={monitor.id}
              initialToken={(monitor as Monitor & { public_token?: string | null }).public_token ?? null}
            />

            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <div className="border-b border-border px-5 py-3">
                <h2 className="text-sm font-medium">Request</h2>
              </div>
              <dl className="divide-y divide-border">
                <Row k="method" v={step?.method ?? "—"} />
                <Row k="url" v={step?.url ?? "—"} mono />
                {step?.headers
                  ? Object.entries(step.headers).map(([name, value]) => (
                      <Row key={name} k={name} v={value} mono />
                    ))
                  : null}
                {step?.body ? <Row k="body" v={step.body} mono /> : null}
              </dl>
            </div>

            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <div className="border-b border-border px-5 py-3">
                <h2 className="text-sm font-medium">Assertions</h2>
              </div>
              <ul className="divide-y divide-border">
                {step?.assertions?.map((a, i) => (
                  <li key={i} className="px-5 py-3 font-mono text-xs">
                    {assertionLabel(a)}
                  </li>
                )) ?? <li className="px-5 py-3 text-xs text-muted-foreground">No assertions</li>}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </>
  )
}

function Stat({ label, value, sub, mono }: { label: string; value: string; sub?: string; mono?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={cn("mt-2 text-xl font-semibold tabular-nums", mono && "font-mono text-base")}>{value}</div>
      {sub ? <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div> : null}
    </div>
  )
}

function Row({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="grid grid-cols-[110px_1fr] items-start gap-3 px-5 py-2.5">
      <dt className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{k}</dt>
      <dd className={cn("min-w-0 break-all text-xs", mono && "font-mono")}>{v}</dd>
    </div>
  )
}

function assertionLabel(a: { kind: string; op?: string; value?: unknown; name?: string; jsonPath?: string }) {
  if (a.kind === "status") return `status ${a.op} ${a.value}`
  if (a.kind === "duration_ms") return `duration_ms ${a.op} ${a.value}`
  if (a.kind === "header") return `header ${a.name} ${a.op}${a.value ? ` ${a.value}` : ""}`
  if (a.kind === "body") return `body ${a.jsonPath} ${a.op}${a.value !== undefined ? ` ${JSON.stringify(a.value)}` : ""}`
  return a.kind
}
