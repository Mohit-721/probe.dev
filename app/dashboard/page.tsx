import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/dashboard/page-header"
import { StatCard } from "@/components/dashboard/stat-card"
import { StatusPill } from "@/components/dashboard/status-pill"
import { ActivityStrip } from "@/components/dashboard/activity-strip"
import { NoMonitorsEmpty } from "@/components/dashboard/no-monitors-empty"
import { Button } from "@/components/ui/button"
import { Activity, Boxes, Clock, Plus, Siren, TrendingUp } from "lucide-react"
import type { Monitor, Run } from "@/lib/types"

type Stats = {
  monitors_total: number
  monitors_healthy: number
  monitors_failing: number
  monitors_degraded: number
  incidents_open: number
  runs_24h: number
  runs_24h_failed: number
  avg_duration_ms_24h: number
}

const EMPTY_STATS: Stats = {
  monitors_total: 0,
  monitors_healthy: 0,
  monitors_failing: 0,
  monitors_degraded: 0,
  incidents_open: 0,
  runs_24h: 0,
  runs_24h_failed: 0,
  avg_duration_ms_24h: 0,
}

export default async function DashboardOverviewPage() {
  const supabase = await createClient()

  // Stats (RPC may not exist yet pre-migration; fall back gracefully)
  const { data: statsData } = await supabase.rpc("get_dashboard_stats")
  const stats: Stats = statsData ? { ...EMPTY_STATS, ...(statsData as Stats) } : EMPTY_STATS

  const { data: monitorsRaw } = await supabase
    .from("monitors")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(6)

  const monitors = (monitorsRaw ?? []) as Monitor[]

  // Pull a wider window of recent runs so we can both feed the dashboard feed AND
  // build per-monitor activity strips on each card.
  const { data: recentRunsRaw } = await supabase
    .from("runs")
    .select("id, monitor_id, status, started_at, duration_ms, region")
    .order("started_at", { ascending: false })
    .limit(240)

  const allRecent = (recentRunsRaw ?? []) as Pick<
    Run,
    "id" | "monitor_id" | "status" | "started_at" | "duration_ms" | "region"
  >[]

  const recentRuns = allRecent.slice(0, 8)

  // Build per-monitor history (oldest → newest, last 40)
  const runsByMonitor = new Map<string, Array<{ status: string }>>()
  for (const r of allRecent) {
    const arr = runsByMonitor.get(r.monitor_id) ?? []
    arr.push({ status: r.status })
    runsByMonitor.set(r.monitor_id, arr)
  }
  for (const [k, v] of runsByMonitor) runsByMonitor.set(k, v.slice(0, 40).reverse())

  const monitorMap = new Map(monitors.map((m) => [m.id, m.name]))

  const uptime =
    stats.runs_24h > 0
      ? Math.max(0, 100 - (stats.runs_24h_failed / stats.runs_24h) * 100)
      : 100

  return (
    <>
      <PageHeader
        breadcrumb={<span>~ / overview</span>}
        title="Overview"
        description="Real-time health of every monitor across your workspace."
        actions={
          <Button asChild className="rounded-full">
            <Link href="/dashboard/monitors/new">
              <Plus className="mr-1.5 size-4" /> New monitor
            </Link>
          </Button>
        }
      />

      <div className="space-y-8 px-4 py-6 md:px-8 md:py-8">
        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          <StatCard
            label="Monitors"
            value={stats.monitors_total}
            hint={`${stats.monitors_healthy} healthy · ${stats.monitors_failing} failing`}
            icon={Boxes}
          />
          <StatCard
            label="Uptime 24h"
            value={`${uptime.toFixed(2)}%`}
            hint={`${stats.runs_24h.toLocaleString()} runs in last 24h`}
            icon={TrendingUp}
            tone="primary"
          />
          <StatCard
            label="Avg latency"
            value={`${stats.avg_duration_ms_24h}ms`}
            hint="across all monitors"
            icon={Clock}
          />
          <StatCard
            label="Open incidents"
            value={stats.incidents_open}
            hint={stats.incidents_open ? "Needs attention" : "All clear"}
            icon={Siren}
            tone={stats.incidents_open > 0 ? "destructive" : "default"}
          />
        </div>

        {/* Monitors grid */}
        <section className="space-y-3">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Monitors</h2>
              <p className="text-xs text-muted-foreground">Recent activity per probe</p>
            </div>
            <Link
              href="/dashboard/monitors"
              className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              View all
            </Link>
          </div>

          {monitors.length === 0 ? (
            <NoMonitorsEmpty />
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {monitors.map((m) => (
                <Link
                  key={m.id}
                  href={`/dashboard/monitors/${m.id}`}
                  className="group relative overflow-hidden rounded-xl border border-border bg-card p-4 transition-colors hover:border-foreground/20"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate font-medium">{m.name}</div>
                      <div className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">{m.slug}</div>
                    </div>
                    <StatusPill status={m.last_status} />
                  </div>
                  <div className="mt-4">
                    <ActivityStrip runs={runsByMonitor.get(m.id) ?? []} emptyHint="awaiting first probe" cells={40} />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="font-mono">every {m.schedule}</span>
                    <span className="font-mono">
                      {m.uptime_30d !== null ? `${m.uptime_30d}% / 30d` : "no data"}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Recent runs feed */}
        <section className="space-y-3">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Recent runs</h2>
              <p className="text-xs text-muted-foreground">Last 8 executions across all monitors</p>
            </div>
            <Link
              href="/dashboard/runs"
              className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            {recentRuns.length === 0 ? (
              <div className="flex items-center gap-3 p-6 text-sm text-muted-foreground">
                <Activity className="size-4" /> No runs yet. Once you create a monitor, runs appear here.
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {recentRuns.map((r) => (
                  <li key={r.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                    <StatusPill status={r.status} size="xs" />
                    <span className="min-w-0 flex-1 truncate font-mono text-muted-foreground">
                      {monitorMap.get(r.monitor_id) ?? r.monitor_id}
                    </span>
                    <span className="hidden font-mono text-xs text-muted-foreground sm:inline">{r.region}</span>
                    <span className="w-16 text-right font-mono text-xs tabular-nums text-muted-foreground">
                      {r.duration_ms != null ? `${r.duration_ms}ms` : "—"}
                    </span>
                    <span className="hidden w-32 text-right font-mono text-xs text-muted-foreground md:inline">
                      {new Date(r.started_at).toLocaleTimeString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </>
  )
}
