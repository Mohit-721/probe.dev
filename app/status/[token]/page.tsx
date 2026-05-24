import Link from "next/link"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { StatusBoard } from "@/components/status/status-board"
import { Logo } from "@/components/logo"
import { ThemeToggle } from "@/components/theme-toggle"
import type { Monitor, Run, Incident } from "@/lib/types"

export const revalidate = 30 // refresh public page every 30s

export default async function PublicStatusPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = await createClient()

  const { data: monitorRaw } = await supabase
    .from("monitors")
    .select("*")
    .eq("public_token", token)
    .maybeSingle()

  if (!monitorRaw) notFound()
  const monitor = monitorRaw as Monitor

  const { data: runsRaw } = await supabase
    .from("runs")
    .select("id, status, duration_ms, started_at, completed_at")
    .eq("monitor_id", monitor.id)
    .order("started_at", { ascending: false })
    .limit(90)

  const runs = (runsRaw ?? []) as Pick<Run, "id" | "status" | "duration_ms" | "started_at" | "completed_at">[]

  const { data: incidentsRaw } = await supabase
    .from("incidents")
    .select("id, title, summary, status, severity, opened_at, resolved_at")
    .eq("monitor_id", monitor.id)
    .order("opened_at", { ascending: false })
    .limit(20)
  const incidents = (incidentsRaw ?? []) as Pick<
    Incident,
    "id" | "title" | "summary" | "status" | "severity" | "opened_at" | "resolved_at"
  >[]

  return (
    <div className="min-h-svh bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 md:px-6">
          <Link href="/" className="flex items-center">
            <Logo />
          </Link>
          <div className="flex items-center gap-2">
            <span className="hidden text-xs font-mono text-muted-foreground md:inline">public status board</span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <StatusBoard monitor={monitor} runs={runs} incidents={incidents} />

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row md:px-6">
          <span className="font-mono">
            Page auto-refreshes every 30s · last refresh {new Date().toLocaleTimeString()}
          </span>
          <Link href="/" className="font-mono hover:text-foreground">
            powered by Probe
          </Link>
        </div>
      </footer>
    </div>
  )
}
