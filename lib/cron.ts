// Tiny cron-next helper. Supports the patterns Probe exposes in the UI:
//   "* * * * *"      every minute
//   "*/N * * * *"    every N minutes
//   "0 * * * *"      every hour on the hour
//   "0 0 * * *"      daily at midnight UTC
// Falls back to "+5 minutes" for anything unrecognised so we always make progress.
export function nextRunAt(schedule: string, from: Date = new Date()): Date {
  const parts = schedule.trim().split(/\s+/)
  if (parts.length !== 5) return addMinutes(from, 5)

  const [minute, hour, dom, mon, dow] = parts

  // every minute
  if (minute === "*" && hour === "*" && dom === "*" && mon === "*" && dow === "*") {
    return addMinutes(from, 1)
  }

  // every N minutes
  const stepMinutes = parseStep(minute)
  if (stepMinutes && hour === "*" && dom === "*" && mon === "*" && dow === "*") {
    return addMinutes(from, stepMinutes)
  }

  // hourly on a fixed minute
  if (/^\d+$/.test(minute) && hour === "*" && dom === "*" && mon === "*" && dow === "*") {
    const m = parseInt(minute, 10)
    const next = new Date(from)
    next.setUTCSeconds(0, 0)
    if (next.getUTCMinutes() >= m) next.setUTCHours(next.getUTCHours() + 1)
    next.setUTCMinutes(m)
    return next
  }

  // daily at H:M UTC
  if (/^\d+$/.test(minute) && /^\d+$/.test(hour) && dom === "*" && mon === "*" && dow === "*") {
    const m = parseInt(minute, 10)
    const h = parseInt(hour, 10)
    const next = new Date(from)
    next.setUTCSeconds(0, 0)
    next.setUTCMinutes(m)
    next.setUTCHours(h)
    if (next <= from) next.setUTCDate(next.getUTCDate() + 1)
    return next
  }

  return addMinutes(from, 5)
}

function parseStep(field: string): number | null {
  const m = /^\*\/(\d+)$/.exec(field)
  if (!m) return null
  const n = parseInt(m[1], 10)
  return Number.isFinite(n) && n > 0 && n <= 59 ? n : null
}

function addMinutes(d: Date, m: number) {
  return new Date(d.getTime() + m * 60_000)
}

export function humanCron(schedule: string): string {
  if (schedule === "* * * * *") return "every minute"
  if (schedule === "*/5 * * * *") return "every 5 minutes"
  if (schedule === "*/15 * * * *") return "every 15 minutes"
  if (schedule === "0 * * * *") return "every hour"
  if (schedule === "0 0 * * *") return "daily at midnight UTC"
  return schedule
}
