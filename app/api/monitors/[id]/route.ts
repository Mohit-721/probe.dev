import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()

  // Auth check — dashboard data is private
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: monitor } = await supabase
    .from("monitors")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle()

  if (!monitor) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const { data: runsRaw } = await supabase
    .from("runs")
    .select("*")
    .eq("monitor_id", id)
    .order("started_at", { ascending: false })
    .limit(50)

  return NextResponse.json({
    monitor,
    runs: runsRaw ?? [],
    ts: Date.now(),
  })
}
