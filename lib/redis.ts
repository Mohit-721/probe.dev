import { Redis } from "@upstash/redis"

// Singleton Upstash Redis client.
// Used for: token caching between multi-step API checks, rate limits,
// and ephemeral run state.
export const redis = new Redis({
  url: process.env.KV_REST_API_URL ?? "",
  token: process.env.KV_REST_API_TOKEN ?? "",
})

// Cache a value extracted from a step (e.g. an auth token from /login)
// so subsequent steps in the same monitor flow can reuse it.
export async function cacheStepValue(monitorId: string, key: string, value: unknown, ttlSeconds = 300) {
  await redis.set(`probe:flow:${monitorId}:${key}`, value, { ex: ttlSeconds })
}

export async function getCachedStepValue<T = unknown>(monitorId: string, key: string): Promise<T | null> {
  return (await redis.get(`probe:flow:${monitorId}:${key}`)) as T | null
}

// Lightweight rate limiter for manual run-now buttons.
export async function checkManualRunRateLimit(userId: string, limit = 30, windowSec = 60) {
  const key = `probe:rate:run:${userId}`
  const count = await redis.incr(key)
  if (count === 1) {
    await redis.expire(key, windowSec)
  }
  return { allowed: count <= limit, count, limit, windowSec }
}
