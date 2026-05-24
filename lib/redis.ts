import { Redis } from "@upstash/redis"

// Support both standard Upstash variables and Vercel KV variables
const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || ""
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || ""

// Ephemerally check to prevent client instantiation crashes
export const redis = redisUrl && redisToken
  ? new Redis({ url: redisUrl, token: redisToken })
  : null

// Cache a value extracted from a step (e.g. an auth token from /login)
// so subsequent steps in the same monitor flow can reuse it.
export async function cacheStepValue(monitorId: string, key: string, value: unknown, ttlSeconds = 300) {
  if (!redis) return
  try {
    await redis.set(`probe:flow:${monitorId}:${key}`, value, { ex: ttlSeconds })
  } catch (err) {
    console.error("[redis] Failed to cache step value:", err)
  }
}

export async function getCachedStepValue<T = unknown>(monitorId: string, key: string): Promise<T | null> {
  if (!redis) return null
  try {
    return (await redis.get(`probe:flow:${monitorId}:${key}`)) as T | null
  } catch (err) {
    console.error("[redis] Failed to get cached step value:", err)
    return null
  }
}

// Lightweight rate limiter for manual run-now buttons.
export async function checkManualRunRateLimit(userId: string, limit = 30, windowSec = 60) {
  if (!redis) {
    // Fail open if Redis is not configured
    return { allowed: true, count: 0, limit, windowSec }
  }
  try {
    const key = `probe:rate:run:${userId}`
    const count = await redis.incr(key)
    if (count === 1) {
      await redis.expire(key, windowSec)
    }
    return { allowed: count <= limit, count, limit, windowSec }
  } catch (err) {
    console.error("[redis] Rate limiter error, failing open:", err)
    return { allowed: true, count: 0, limit, windowSec }
  }
}
