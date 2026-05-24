"use client"

import * as React from "react"
import { gsap, ScrollTrigger } from "@/lib/gsap"
import { AlertTriangle, CheckCircle2 } from "lucide-react"

export function ProblemSection() {
  const root = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!root.current) return
    const ctx = gsap.context(() => {
      gsap.from(".prob-card", {
        scrollTrigger: {
          trigger: root.current,
          start: "top 75%",
        },
        y: 30,
        opacity: 0,
        duration: 0.8,
        stagger: 0.12,
        ease: "power3.out",
      })

      gsap.from(".prob-heading > *", {
        scrollTrigger: {
          trigger: ".prob-heading",
          start: "top 80%",
        },
        y: 20,
        opacity: 0,
        duration: 0.8,
        stagger: 0.08,
        ease: "power3.out",
      })
    }, root)
    return () => {
      ctx.revert()
      ScrollTrigger.getAll().forEach((s) => s.kill())
    }
  }, [])

  return (
    <section ref={root} id="product" className="relative py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-4">
        <div className="prob-heading mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground">
            <span className="size-1.5 rounded-full bg-destructive" />
            The 200 OK problem
          </div>
          <h2 className="mt-5 text-balance text-3xl font-semibold tracking-tight md:text-5xl">
            Most monitors check if it&apos;s <span className="text-muted-foreground line-through">alive</span>.
            <br />
            We check if it&apos;s <span className="text-primary italic font-serif">honest</span>.
          </h2>
          <p className="mt-5 text-pretty text-muted-foreground md:text-lg">
            Your DB is down. Your endpoint returns <code className="font-mono text-foreground">[]</code>.
            Status code? <code className="font-mono text-foreground">200</code>. Pingdom says &quot;all good&quot;.
            Your customers say otherwise.
          </p>
        </div>

        <div className="mt-14 grid gap-4 md:grid-cols-2">
          {/* Old way */}
          <div className="prob-card group relative overflow-hidden rounded-2xl border border-border/70 bg-card p-6 md:p-8">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Yesterday&apos;s tools
              </span>
              <AlertTriangle className="size-4 text-destructive" />
            </div>
            <h3 className="mt-3 text-xl font-semibold">Ping. Hope. Repeat.</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              HTTP 200 + a regex on the body. That&apos;s it. No state, no schema, no security.
            </p>

            <ul className="mt-6 space-y-3 font-mono text-[13px]">
              <FailRow path="GET /api/users" status="200" reason='body matches "users"' />
              <FailRow path="GET /api/health" status="200" reason='contains "ok"' />
              <FailRow path="GET /api/orders" status="200" reason="response time < 2000ms" />
            </ul>

            <div className="mt-6 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
              <AlertTriangle className="size-3.5" />
              Database is down. Empty array returned. Monitor: 🟢 Healthy.
            </div>
          </div>

          {/* New way */}
          <div className="prob-card group relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/5 via-card to-card p-6 md:p-8">
            <div className="absolute -right-20 -top-20 size-64 rounded-full bg-primary/10 blur-3xl" aria-hidden />
            <div className="relative">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider text-primary">
                  Probe&apos;s approach
                </span>
                <CheckCircle2 className="size-4 text-primary" />
              </div>
              <h3 className="mt-3 text-xl font-semibold">Verify. State. Secure.</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Multi-step flows, JSON Schema validation, embedded vulnerability scans, and AI baselines.
              </p>

              <ul className="mt-6 space-y-3 font-mono text-[13px]">
                <PassRow label="auth → user → orders" detail="3-step flow, token chained" />
                <PassRow label="schema validation" detail="409 fields × strict types" />
                <PassRow label="security scan" detail="HSTS, CSP, TLS 1.3, no XSS" />
                <PassRow label="ai latency baseline" detail="learning Tue 09:00 traffic" />
              </ul>

              <div className="mt-6 flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-xs text-primary">
                <CheckCircle2 className="size-3.5" />
                Empty array detected. Schema breach: expected ≥ 1 item. Alert sent.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function FailRow({ path, status, reason }: { path: string; status: string; reason: string }) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-background/40 px-3 py-2">
      <span className="truncate text-foreground">{path}</span>
      <div className="flex shrink-0 items-center gap-3 text-muted-foreground">
        <span className="text-[11px]">{reason}</span>
        <span className="rounded-md border border-border/60 px-1.5 py-0.5 text-[10px]">{status}</span>
      </div>
    </li>
  )
}

function PassRow({ label, detail }: { label: string; detail: string }) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-lg border border-primary/20 bg-background/60 px-3 py-2">
      <span className="truncate text-foreground">{label}</span>
      <span className="shrink-0 text-[11px] text-muted-foreground">{detail}</span>
    </li>
  )
}
