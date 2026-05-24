import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { runMonitor } from "@/lib/runner"
import type { Monitor } from "@/lib/types"

export const dynamic = "force-dynamic"
export const maxDuration = 50 // Leave 10s buffer for response + cleanup

/**
 * Cron entry point. Vercel calls this every minute (vercel.json).
 *
 * **Fail-closed authentication:**
 * - CRON_SECRET must be set (no fallback)
 * - SUPABASE_SERVICE_ROLE_KEY must be set (no fallback to anon key)
 *
 * **Atomic claiming:**
 * - Uses claim_due_monitors(batch) RPC with SELECT...FOR UPDATE SKIP LOCKED
 * - Prevents double-runs if two cron invocations overlap
 *
 * **Parallel execution:**
 * - Runs monitors concurrently (default 5 at a time)
 * - Balances throughput vs. function resource limits
 */
export async function GET(request: Request) {
  // ============ AUTHENTICATION (fail-closed) ============
  if (!process.env.CRON_SECRET) {
    console.error("[cron] CRON_SECRET not configured")
    return NextResponse.json(
      { error: "CRON_SECRET not configured on server" },
      { status: 500 },
    )
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("[cron] SUPABASE_SERVICE_ROLE_KEY not configured")
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY not configured on server" },
      { status: 500 },
    )
  }

  const auth = request.headers.get("authorization")
  const expected = `Bearer ${process.env.CRON_SECRET}`

  if (auth !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  // ============ CLAIM DUE MONITORS (atomic) ============
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  )

  const { data: claimed, error: claimError } = await supabase.rpc("claim_due_monitors", {
    p_batch: 20,
  })

  if (claimError) {
    console.error("[cron] claim_due_monitors failed:", claimError)
    return NextResponse.json({ error: claimError.message }, { status: 500 })
  }

  if (!claimed || claimed.length === 0) {
    return NextResponse.json({ ok: true, ran: 0, failed: 0 })
  }

  const monitors = claimed as Monitor[]

  // ============ RUN IN PARALLEL (with concurrency cap) ============
  const concurrency = 5
  let ran = 0
  let failed = 0

  for (let i = 0; i < monitors.length; i += concurrency) {
    const batch = monitors.slice(i, i + concurrency)
    const results = await Promise.allSettled(
      batch.map((m) => runMonitor(supabase, m, "schedule")),
    )

    for (const result of results) {
      if (result.status === "fulfilled") {
        ran++
      } else {
        failed++
        console.error("[cron] run failed:", result.reason)
      }
    }
  }

  return NextResponse.json({
    ok: true,
    ran,
    failed,
    total: monitors.length,
  })
}
