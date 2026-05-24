"use client"

import * as React from "react"
import { gsap, ScrollTrigger } from "@/lib/gsap"
import { Check, Minus, X } from "lucide-react"

type Cell = "yes" | "no" | "partial"

const ROWS: { feature: string; detail: string; legacy: Cell; probe: Cell }[] = [
  {
    feature: "HTTP/HTTPS uptime checks",
    detail: "Standard cron pings, latency, status codes",
    legacy: "yes",
    probe: "yes",
  },
  {
    feature: "Keyword & regex body matching",
    detail: "Brittle, expensive, breaks on JSON shape changes",
    legacy: "yes",
    probe: "yes",
  },
  {
    feature: "Strict JSON Schema validation",
    detail: "Validate types, structure, nested objects, contracts",
    legacy: "no",
    probe: "yes",
  },
  {
    feature: "Stateful, multi-step flows",
    detail: "Auth → fetch → mutate with extracted variables",
    legacy: "no",
    probe: "yes",
  },
  {
    feature: "Embedded security scans",
    detail: "Header audits, TLS grading, optional payload injection",
    legacy: "no",
    probe: "yes",
  },
  {
    feature: "AI latency baselines",
    detail: "Detect drift before timeouts trigger",
    legacy: "no",
    probe: "yes",
  },
  {
    feature: "Config-as-code (YAML in repo)",
    detail: "Version, review, gate deploys with PR checks",
    legacy: "partial",
    probe: "yes",
  },
  {
    feature: "Inbound heartbeats / cron monitors",
    detail: "Alert when background jobs silently fail",
    legacy: "yes",
    probe: "yes",
  },
  {
    feature: "Public status pages",
    detail: "Auto-generated, themable, custom domains",
    legacy: "yes",
    probe: "yes",
  },
  {
    feature: "Multi-region from day one",
    detail: "iad1, fra1, syd1, hnd1, gru1 — built in",
    legacy: "partial",
    probe: "yes",
  },
]

export function Comparison() {
  const root = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!root.current) return
    const ctx = gsap.context(() => {
      gsap.from(".cmp-head > *", {
        scrollTrigger: { trigger: ".cmp-head", start: "top 80%" },
        y: 20,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
        stagger: 0.08,
      })
      gsap.from(".cmp-row", {
        scrollTrigger: { trigger: ".cmp-table", start: "top 80%" },
        y: 14,
        opacity: 0,
        duration: 0.5,
        ease: "power3.out",
        stagger: 0.04,
      })
    }, root)
    return () => {
      ctx.revert()
      ScrollTrigger.getAll().forEach((s) => s.kill())
    }
  }, [])

  return (
    <section ref={root} id="compare" className="relative py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-4">
        <div className="cmp-head mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground">
            Probe vs. legacy uptime tools
          </div>
          <h2 className="mt-5 text-balance text-3xl font-semibold tracking-tight md:text-5xl">
            What &quot;is it up?&quot; <span className="text-muted-foreground">misses</span>.
          </h2>
          <p className="mt-5 text-pretty text-muted-foreground md:text-lg">
            CheckAPI and similar tools stop at keyword matches. Probe goes the rest of the way:
            schemas, state, security, and statistical anomaly detection.
          </p>
        </div>

        <div className="cmp-table mt-14 overflow-hidden rounded-2xl border border-border/70 bg-card">
          {/* header */}
          <div className="grid grid-cols-[1.6fr_repeat(2,minmax(0,1fr))] items-center gap-2 border-b border-border/70 bg-muted/30 px-5 py-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            <div>Capability</div>
            <div className="text-center">Legacy uptime tools</div>
            <div className="text-center">
              <span className="rounded-md bg-primary/15 px-2 py-1 font-mono text-[11px] text-primary">
                probe
              </span>
            </div>
          </div>

          {ROWS.map((r, i) => (
            <div
              key={r.feature}
              className={`cmp-row grid grid-cols-[1.6fr_repeat(2,minmax(0,1fr))] items-center gap-2 px-5 py-4 ${
                i !== ROWS.length - 1 ? "border-b border-border/60" : ""
              } hover:bg-muted/30 transition-colors`}
            >
              <div>
                <div className="text-sm font-medium">{r.feature}</div>
                <div className="text-xs text-muted-foreground">{r.detail}</div>
              </div>
              <div className="flex justify-center">
                <CellMark v={r.legacy} muted />
              </div>
              <div className="flex justify-center">
                <CellMark v={r.probe} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CellMark({ v, muted = false }: { v: Cell; muted?: boolean }) {
  if (v === "yes")
    return (
      <span
        className={`inline-flex size-7 items-center justify-center rounded-full ${
          muted
            ? "border border-border bg-background text-muted-foreground"
            : "bg-primary text-primary-foreground"
        }`}
      >
        <Check className="size-4" />
      </span>
    )
  if (v === "partial")
    return (
      <span className="inline-flex size-7 items-center justify-center rounded-full border border-border bg-background text-muted-foreground">
        <Minus className="size-4" />
      </span>
    )
  return (
    <span className="inline-flex size-7 items-center justify-center rounded-full border border-border bg-background text-muted-foreground/60">
      <X className="size-4" />
    </span>
  )
}
