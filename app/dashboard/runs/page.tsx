import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/dashboard/page-header"
import { StatusPill } from "@/components/dashboard/status-pill"
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { ChevronRight, Activity } from "lucide-react"

export const dynamic = "force-dynamic"

function formatRelative(iso: string | null) {
  if (!iso) return "—"
  const diff = Date.now() - new Date(iso).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

type RunRow = {
  id: string
  monitor_id: string
  status: "running" | "success" | "failed" | "degraded"
  duration_ms: number | null
  region: string | null
  trigger: string
  started_at: string
  monitors: { name: string; slug: string } | { name: string; slug: string }[] | null
  step_results: Array<{ status_code?: number | null }> | null
}

export default async function RunsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: runsRaw } = await supabase
    .from("runs")
    .select("id, monitor_id, status, duration_ms, region, trigger, started_at, step_results, monitors(name, slug)")
    .order("started_at", { ascending: false })
    .limit(100)

  const runs = (runsRaw ?? []) as unknown as RunRow[]

  return (
    <>
      <PageHeader
        breadcrumb={<span>~ / runs</span>}
        title="Runs"
        description="The full event log. Every probe, every assertion, every response."
      />

      <div className="px-4 py-6 md:px-8 md:py-8">
        {!runs.length ? (
          <Empty className="rounded-xl border border-border bg-card">
            <EmptyHeader>
              <Activity className="size-6 text-muted-foreground" />
              <EmptyTitle>No runs yet</EmptyTitle>
              <EmptyDescription>
                Once your monitors start probing, every run will appear here in real time.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="hidden grid-cols-[100px_1fr_120px_100px_120px_36px] items-center gap-4 border-b border-border bg-muted/40 px-4 py-2.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground md:grid">
              <span>Status</span>
              <span>Monitor</span>
              <span>HTTP</span>
              <span className="text-right">Latency</span>
              <span className="text-right">When</span>
              <span />
            </div>
            <ul className="divide-y divide-border">
              {runs.map((r) => {
                const monitor = Array.isArray(r.monitors) ? r.monitors[0] : r.monitors
                const httpCode = r.step_results?.[0]?.status_code ?? null
                return (
                  <li key={r.id}>
                    <Link
                      href={`/dashboard/runs/${r.id}`}
                      className="grid grid-cols-1 gap-2 px-4 py-3 transition-colors hover:bg-muted/40 md:grid-cols-[100px_1fr_120px_100px_120px_36px] md:items-center md:gap-4"
                    >
                      <StatusPill status={r.status} size="xs" />
                      <span className="truncate text-sm font-medium">{monitor?.name ?? "Untitled"}</span>
                      <span className="font-mono text-xs text-muted-foreground">{httpCode ?? "—"}</span>
                      <span className="text-right font-mono text-xs tabular-nums text-muted-foreground">
                        {r.duration_ms != null ? `${r.duration_ms}ms` : "—"}
                      </span>
                      <span className="text-right font-mono text-xs text-muted-foreground">
                        {formatRelative(r.started_at)}
                      </span>
                      <span className="hidden text-muted-foreground md:flex md:justify-end">
                        <ChevronRight className="size-4" />
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </div>
    </>
  )
}
