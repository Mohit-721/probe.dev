"use client"

import * as React from "react"
import { gsap, ScrollTrigger } from "@/lib/gsap"

type Stat = {
  value: number
  suffix?: string
  prefix?: string
  decimals?: number
  label: string
  caption: string
  /** Trend points 0..1 (relative). Drives the sparkline shape. */
  trend: number[]
  /** Direction the trend communicates. Affects color. */
  direction: "up" | "down"
}

const STATS: Stat[] = [
  {
    value: 12.4,
    suffix: "M",
    decimals: 1,
    label: "probes / month",
    caption: "across customer fleets",
    trend: [0.2, 0.28, 0.31, 0.4, 0.46, 0.55, 0.62, 0.7, 0.78, 0.85, 0.92, 1],
    direction: "up",
  },
  {
    value: 99.997,
    suffix: "%",
    decimals: 3,
    label: "uptime SLO",
    caption: "for the Probe runner itself",
    trend: [0.85, 0.92, 0.94, 0.93, 0.97, 0.96, 0.99, 0.98, 1, 0.99, 1, 1],
    direction: "up",
  },
  {
    value: 84,
    suffix: "ms",
    label: "p50 detection",
    caption: "from failure to alert",
    trend: [1, 0.92, 0.85, 0.78, 0.74, 0.7, 0.6, 0.55, 0.5, 0.42, 0.38, 0.32],
    direction: "down",
  },
  {
    value: 41,
    prefix: "−",
    suffix: "%",
    label: "false positives",
    caption: "vs. legacy uptime tools",
    trend: [1, 0.95, 0.88, 0.82, 0.78, 0.7, 0.66, 0.6, 0.55, 0.48, 0.42, 0.38],
    direction: "down",
  },
]

export function StatsCounter() {
  const root = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!root.current) return
    const ctx = gsap.context(() => {
      gsap.from(".stat-card", {
        scrollTrigger: { trigger: root.current, start: "top 80%" },
        y: 30,
        opacity: 0,
        duration: 0.7,
        ease: "power3.out",
        stagger: 0.12,
      })

      const numbers = gsap.utils.toArray<HTMLElement>("[data-stat-target]")
      numbers.forEach((el) => {
        const target = parseFloat(el.dataset.statTarget!)
        const decimals = parseInt(el.dataset.statDecimals ?? "0", 10)
        const prefix = el.dataset.statPrefix ?? ""
        const suffix = el.dataset.statSuffix ?? ""
        const obj = { v: 0 }
        gsap.to(obj, {
          v: target,
          duration: 1.6,
          ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 85%", once: true },
          onUpdate: () => {
            el.textContent = `${prefix}${obj.v.toFixed(decimals)}${suffix}`
          },
        })
      })

      // Sparkline draw-on
      const paths = gsap.utils.toArray<SVGPathElement>("[data-spark-path]")
      paths.forEach((p) => {
        const len = p.getTotalLength()
        gsap.set(p, { strokeDasharray: len, strokeDashoffset: len })
        gsap.to(p, {
          strokeDashoffset: 0,
          duration: 1.6,
          ease: "power2.out",
          scrollTrigger: { trigger: p, start: "top 85%", once: true },
        })
      })

      // Sparkline area fill in
      const areas = gsap.utils.toArray<SVGPathElement>("[data-spark-area]")
      areas.forEach((a) => {
        gsap.fromTo(
          a,
          { opacity: 0 },
          {
            opacity: 1,
            duration: 1.4,
            delay: 0.2,
            ease: "power2.out",
            scrollTrigger: { trigger: a, start: "top 85%", once: true },
          },
        )
      })
    }, root)

    return () => {
      ctx.revert()
      ScrollTrigger.refresh()
    }
  }, [])

  return (
    <section ref={root} className="relative border-y border-border/60 bg-muted/20 py-20 md:py-28">
      <div aria-hidden className="pointer-events-none absolute inset-0 grid-bg grid-bg-fade opacity-50" />
      <div className="relative mx-auto max-w-6xl px-4">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
              <span className="size-1.5 rounded-full bg-primary" />
              numbers, not narratives
            </div>
            <h2 className="mt-4 max-w-2xl text-balance font-sans text-3xl font-semibold tracking-tight md:text-5xl">
              Built for the scale of <span className="text-primary">modern APIs</span>.
            </h2>
          </div>
          <p className="hidden max-w-sm text-pretty text-sm text-muted-foreground md:block">
            Probe is the invisible layer that watches every route, every step, every contract.
            These are the numbers behind the calm.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 md:gap-5">
          {STATS.map((s, i) => (
            <article
              key={i}
              className="stat-card relative overflow-hidden rounded-2xl border border-border/70 bg-card/70 p-5 backdrop-blur"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute -right-12 -top-12 size-32 rounded-full bg-primary/10 blur-2xl"
              />

              <div className="relative flex items-start justify-between gap-3">
                <div>
                  <div
                    data-stat-target={s.value}
                    data-stat-decimals={s.decimals ?? 0}
                    data-stat-prefix={s.prefix ?? ""}
                    data-stat-suffix={s.suffix ?? ""}
                    className="font-sans text-4xl font-semibold tabular-nums tracking-tight md:text-5xl"
                  >
                    {s.prefix ?? ""}0{s.suffix ?? ""}
                  </div>
                  <div className="mt-2 text-sm font-medium">{s.label}</div>
                </div>
                <DirectionPill direction={s.direction} />
              </div>

              {/* Sparkline */}
              <div className="relative mt-4 h-10 w-full">
                <Sparkline points={s.trend} />
              </div>

              <div className="relative mt-2 text-xs text-muted-foreground">{s.caption}</div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function DirectionPill({ direction }: { direction: "up" | "down" }) {
  const isUp = direction === "up"
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-primary"
      aria-label={isUp ? "Trend up" : "Trend down"}
    >
      <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden>
        <path
          d={isUp ? "M1 6 L4 2 L7 6" : "M1 2 L4 6 L7 2"}
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {isUp ? "up" : "down"}
    </span>
  )
}

function Sparkline({ points }: { points: number[] }) {
  // Build a polyline path scaled to a 100×40 viewBox
  const W = 100
  const H = 40
  const step = W / (points.length - 1)
  const path =
    "M " +
    points.map((p, i) => `${(i * step).toFixed(2)} ${(H - p * H + 2).toFixed(2)}`).join(" L ")
  const area = path + ` L ${W} ${H} L 0 ${H} Z`
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className="absolute inset-0 h-full w-full"
      aria-hidden
    >
      <defs>
        <linearGradient id="spark-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path data-spark-area d={area} fill="url(#spark-fill)" />
      <path
        data-spark-path
        d={path}
        stroke="var(--primary)"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
