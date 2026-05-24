import { streamText, convertToModelMessages, type UIMessage } from "ai"
import { createOpenAI } from "@ai-sdk/openai"
import { createClient } from "@/lib/supabase/server"
import { Redis } from "@upstash/redis"

export const maxDuration = 60

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

/**
 * Rate limit: 20 AI queries per user per hour.
 * Prevents single user from running up the AI Gateway bill.
 */
async function checkInsightsRateLimit(userId: string): Promise<{ ok: boolean; remaining: number }> {
  const key = `insights:${userId}`
  const limit = 20
  const window = 3600 // 1 hour in seconds

  try {
    const current = await redis.incr(key)
    if (current === 1) {
      // First request in this window — set expiry
      await redis.expire(key, window)
    }
    return {
      ok: current <= limit,
      remaining: Math.max(0, limit - current),
    }
  } catch {
    // Redis unavailable — fail open (allow the request)
    return { ok: true, remaining: -1 }
  }
}

export async function POST(req: Request) {
  const { messages, monitorId }: { messages: UIMessage[]; monitorId?: string } = await req.json()

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return new Response("Unauthorized", { status: 401 })

  // Rate limit check
  const { ok: withinLimit, remaining } = await checkInsightsRateLimit(user.id)
  if (!withinLimit) {
    return new Response(
      JSON.stringify({
        error: "Rate limit exceeded. Maximum 20 queries per hour.",
        remaining,
      }),
      { status: 429, headers: { "content-type": "application/json" } },
    )
  }

  // Build a compact context block from the user's data.
  const monitorsQ = supabase
    .from("monitors")
    .select("id, name, slug, schedule, last_status, config")
    .order("created_at", { ascending: false })
    .limit(20)

  const runsQ = supabase
    .from("runs")
    .select("id, monitor_id, status, duration_ms, started_at, error_message, step_results")
    .order("started_at", { ascending: false })
    .limit(30)

  const incidentsQ = supabase
    .from("incidents")
    .select("id, monitor_id, title, summary, status, opened_at, resolved_at")
    .order("opened_at", { ascending: false })
    .limit(15)

  const [{ data: monitors }, { data: runs }, { data: incidents }] = await Promise.all([
    monitorsQ,
    runsQ,
    incidentsQ,
  ])

  const monitorMap = new Map((monitors ?? []).map((m: { id: string; name: string }) => [m.id, m.name]))

  // If a specific monitor was passed, narrow the context.
  const filteredRuns = monitorId ? (runs ?? []).filter((r: { monitor_id: string }) => r.monitor_id === monitorId) : (runs ?? [])
  const filteredIncidents = monitorId
    ? (incidents ?? []).filter((i: { monitor_id: string }) => i.monitor_id === monitorId)
    : (incidents ?? [])

  const context = {
    monitors: (monitors ?? []).map((m: { id: string; name: string; slug: string; schedule: string; last_status: string | null; config: { steps?: { method?: string; url?: string }[] } }) => ({
      name: m.name,
      slug: m.slug,
      schedule: m.schedule,
      last_status: m.last_status,
      first_step: m.config?.steps?.[0] ? { method: m.config.steps[0].method, url: m.config.steps[0].url } : null,
    })),
    recent_failed_runs: filteredRuns
      .filter((r: { status: string }) => r.status !== "success")
      .slice(0, 10)
      .map((r: { monitor_id: string; status: string; duration_ms: number | null; started_at: string; error_message: string | null; step_results: { step?: string; assertions?: { ok: boolean; name: string }[] }[] }) => ({
        monitor: monitorMap.get(r.monitor_id) ?? r.monitor_id,
        status: r.status,
        duration_ms: r.duration_ms,
        when: r.started_at,
        error: r.error_message,
        failed_assertions: (r.step_results ?? [])
          .flatMap((s) => (s.assertions ?? []).filter((a) => !a.ok))
          .map((a: { name: string }) => a.name)
          .slice(0, 5),
      })),
    open_incidents: filteredIncidents
      .filter((i: { status: string }) => i.status === "open")
      .map((i: { monitor_id: string; title: string; summary: string | null; opened_at: string }) => ({
        monitor: monitorMap.get(i.monitor_id) ?? i.monitor_id,
        title: i.title,
        summary: i.summary,
        opened_at: i.opened_at,
      })),
  }

  const system = [
    "You are Probe Insights, a senior SRE assistant analyzing API monitor data.",
    "Be concise, technical, and skeptical. Skip fluff.",
    "Always structure your reply with these sections (markdown): ",
    "1. **Summary** — one or two sentences on overall health.",
    "2. **Top issues** — bullet list, each with the monitor name, what's failing, and a likely root cause.",
    "3. **Recommended actions** — concrete next steps (e.g. add a `duration_ms < 800` assertion).",
    "Use code spans for headers, status codes, jsonpaths, and YAML keys.",
    "Never invent data — if context is empty, say so plainly.",
    "",
    "Workspace context (JSON):",
    JSON.stringify(context, null, 2),
  ].join("\n")

  const openaiInstance = createOpenAI({
    baseURL: process.env.OPENAI_BASE_URL || "https://integrate.api.nvidia.com/v1",
    apiKey: process.env.OPENAI_API_KEY,
  })

  const modelName = process.env.OPENAI_MODEL_NAME || "meta/llama-3.1-70b-instruct"

  const result = streamText({
    model: openaiInstance(modelName),
    system,
    messages: await convertToModelMessages(messages),
  })

  return result.toUIMessageStreamResponse()
}
