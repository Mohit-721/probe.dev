import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params
  const supabase = await createClient()

  const { data: monitor } = await supabase
    .from("monitors")
    .select("id, name, slug, description, schedule, last_status, last_run_at, uptime_30d, enabled")
    .eq("public_token", token)
    .maybeSingle()

  if (!monitor) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const { data: runsRaw } = await supabase
    .from("runs")
    .select("id, status, duration_ms, started_at, completed_at")
    .eq("monitor_id", monitor.id)
    .order("started_at", { ascending: false })
    .limit(90)

  const { data: incidentsRaw } = await supabase
    .from("incidents")
    .select("id, title, summary, status, severity, opened_at, resolved_at")
    .eq("monitor_id", monitor.id)
    .order("opened_at", { ascending: false })
    .limit(20)

  return NextResponse.json({
    monitor,
    runs: runsRaw ?? [],
    incidents: incidentsRaw ?? [],
    ts: Date.now(),
  })
}
