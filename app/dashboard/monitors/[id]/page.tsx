import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { MonitorDetailLive } from "@/components/dashboard/monitor-detail-live"
import type { Monitor, Run } from "@/lib/types"

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

  return <MonitorDetailLive initialMonitor={monitor} initialRuns={runs} />
}
