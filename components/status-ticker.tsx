"use client"

import * as React from "react"
import { Activity, AlertTriangle, CheckCircle2, ShieldAlert, Zap } from "lucide-react"
import { gsap } from "@/lib/gsap"

type Item = { icon: React.ComponentType<{ className?: string }>; text: string; tone: "ok" | "warn" | "err" }

const ITEMS: Item[] = [
  { icon: CheckCircle2, text: "checkout-suite passed in 412ms", tone: "ok" },
  { icon: AlertTriangle, text: "p95 drift on /v2/billing — +412%", tone: "warn" },
  { icon: ShieldAlert, text: "CSP missing on /v2/users", tone: "err" },
  { icon: CheckCircle2, text: "auth → fetch → logout — 3 steps green", tone: "ok" },
  { icon: Zap, text: "AI baseline updated · Tue 09:00 UTC", tone: "ok" },
  { icon: Activity, text: "12,408 probes in the last hour", tone: "ok" },
  { icon: AlertTriangle, text: "schema mismatch · expected int got string", tone: "warn" },
  { icon: CheckCircle2, text: "deploy ✓ · monitors auto-synced", tone: "ok" },
]

export function StatusTicker() {
  const trackRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!trackRef.current) return
    const track = trackRef.current
    // Width of one copy of the list (we render two copies for seamless loop)
    const halfWidth = track.scrollWidth / 2
    const tween = gsap.to(track, {
      x: -halfWidth,
      duration: 38,
      ease: "none",
      repeat: -1,
    })
    return () => {
      tween.kill()
    }
  }, [])

  const all = [...ITEMS, ...ITEMS]

  return (
    <div className="relative border-y border-border/60 bg-background/60 backdrop-blur">
      <div aria-hidden className="pointer-events-none absolute inset-0 grid-bg opacity-[0.35]" />
      <div className="ticker-mask relative overflow-hidden">
        <div ref={trackRef} className="flex w-max gap-3 py-3">
          {all.map((it, i) => {
            const Icon = it.icon
            const tone =
              it.tone === "ok"
                ? "text-primary"
                : it.tone === "warn"
                  ? "text-amber-500"
                  : "text-destructive"
            return (
              <div
                key={i}
                className="inline-flex shrink-0 items-center gap-2 rounded-full border border-border/70 bg-card/70 px-3 py-1 text-xs"
              >
                <Icon className={`size-3.5 ${tone}`} />
                <span className="font-mono text-[11px] text-muted-foreground">{it.text}</span>
                <span className="ml-1 inline-block size-1 rounded-full bg-primary/70" />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
