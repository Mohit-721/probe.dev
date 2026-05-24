"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { runMonitor } from "@/lib/runner"
import { checkManualRunRateLimit } from "@/lib/redis"
import type { Monitor } from "@/lib/types"

export async function runMonitorNow(monitorId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const limit = await checkManualRunRateLimit(user.id)
  if (!limit.allowed) {
    return { error: `Rate limit hit (${limit.limit} per ${limit.windowSec}s). Try again shortly.` }
  }

  const { data: monitor, error } = await supabase
    .from("monitors")
    .select("*")
    .eq("id", monitorId)
    .eq("user_id", user.id)
    .single()

  if (error || !monitor) {
    return { error: error?.message ?? "Monitor not found" }
  }

  try {
    const result = await runMonitor(supabase, monitor as Monitor, "manual")

    revalidatePath(`/dashboard/monitors/${monitorId}`)
    revalidatePath("/dashboard")
    revalidatePath("/dashboard/runs")
    return { ok: true, runId: result.runId, status: result.status }
  } catch (err) {
    console.error("[runMonitorNow] Execution crashed:", err)
    return { error: err instanceof Error ? err.message : "An unexpected error occurred during execution." }
  }
}
