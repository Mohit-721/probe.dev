import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/dashboard/page-header"
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { AlertTriangle, ShieldCheck, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

export const dynamic = "force-dynamic"

type IncidentRow = {
  id: string
  monitor_id: string
  title: string
  summary: string | null
  severity: "minor" | "major" | "critical"
  status: "open" | "acknowledged" | "resolved"
  opened_at: string
  resolved_at: string | null
  monitors: { id: string; name: string; slug: string } | { id: string; name: string; slug: string }[] | null
}

function formatDuration(start: string, end: string | null) {
  const ms = (end ? new Date(end).getTime() : Date.now()) - new Date(start).getTime()
  const m = Math.floor(ms / 60000)
  if (m < 1) return "<1m"
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ${m % 60}m`
  return `${Math.floor(h / 24)}d ${h % 24}h`
}

export default async function IncidentsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data } = await supabase
    .from("incidents")
    .select("id, monitor_id, title, summary, severity, status, opened_at, resolved_at, monitors(id, name, slug)")
    .order("opened_at", { ascending: false })
    .limit(100)

  const incidents = (data ?? []) as unknown as IncidentRow[]
  const open = incidents.filter((i) => i.status === "open" || i.status === "acknowledged")
  const resolved = incidents.filter((i) => i.status === "resolved")

  return (
    <>
      <PageHeader
        breadcrumb={<span>~ / incidents</span>}
        title="Incidents"
        description="Every time a monitor breaks, we open an incident. Resolve them by fixing the underlying API."
      />

      <div className="space-y-6 px-4 py-6 md:px-8 md:py-8">
        {incidents.length === 0 && (
          <Empty className="rounded-xl border border-border bg-card">
            <EmptyHeader>
              <ShieldCheck className="size-6 text-primary" />
              <EmptyTitle>All systems healthy</EmptyTitle>
              <EmptyDescription>
                No incidents recorded. We&apos;ll let you know the moment something breaks.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}

        {open.length > 0 && (
          <section>
            <h3 className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-destructive">
              <AlertTriangle className="size-3.5" /> Active · {open.length}
            </h3>
            <div className="overflow-hidden rounded-xl border border-destructive/40 bg-destructive/5">
              <ul className="divide-y divide-border">
                {open.map((i) => (
                  <Row key={i.id} incident={i} active />
                ))}
              </ul>
            </div>
          </section>
        )}

        {resolved.length > 0 && (
          <section>
            <h3 className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Resolved · {resolved.length}
            </h3>
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <ul className="divide-y divide-border">
                {resolved.map((i) => (
                  <Row key={i.id} incident={i} />
                ))}
              </ul>
            </div>
          </section>
        )}
      </div>
    </>
  )
}

function Row({ incident, active }: { incident: IncidentRow; active?: boolean }) {
  const monitor = Array.isArray(incident.monitors) ? incident.monitors[0] : incident.monitors
  const sevColor =
    incident.severity === "critical"
      ? "text-destructive"
      : incident.severity === "major"
        ? "text-amber-500"
        : "text-muted-foreground"

  return (
    <li>
      <Link
        href={monitor?.id ? `/dashboard/monitors/${monitor.id}` : "#"}
        className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-muted/40"
      >
        <span
          aria-hidden
          className={cn(
            "size-2 shrink-0 rounded-full",
            active ? "bg-destructive shadow-[0_0_8px_var(--destructive)]" : "bg-muted-foreground/40",
          )}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-medium">{incident.title}</span>
            <span className={cn("font-mono text-[10px] uppercase tracking-wider", sevColor)}>{incident.severity}</span>
          </div>
          <div className="truncate font-mono text-xs text-muted-foreground">
            {monitor?.slug ?? "—"} · {incident.summary ?? "no summary"}
          </div>
        </div>
        <div className="hidden text-right text-xs text-muted-foreground sm:block">
          <div className="font-mono">{formatDuration(incident.opened_at, incident.resolved_at)}</div>
          <div>{new Date(incident.opened_at).toLocaleString()}</div>
        </div>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
      </Link>
    </li>
  )
}
