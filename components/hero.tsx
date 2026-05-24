"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, ChevronRight, Activity, Shield, Workflow } from "lucide-react"
import { gsap } from "@/lib/gsap"

export function Hero() {
  const root = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!root.current) return
    const ctx = gsap.context(() => {
      // Eyebrow
      gsap.from(".hero-eyebrow", {
        y: 12,
        opacity: 0,
        duration: 0.7,
        ease: "power3.out",
      })

      // Headline word stagger
      const words = gsap.utils.toArray<HTMLElement>(".hero-word")
      gsap.from(words, {
        y: 28,
        opacity: 0,
        duration: 0.9,
        ease: "power4.out",
        stagger: 0.06,
        delay: 0.05,
      })

      gsap.from(".hero-sub", {
        y: 16,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
        delay: 0.45,
      })

      gsap.from(".hero-cta > *", {
        y: 14,
        opacity: 0,
        duration: 0.7,
        ease: "power3.out",
        stagger: 0.08,
        delay: 0.6,
      })

      // Console card
      gsap.from(".hero-console", {
        y: 40,
        opacity: 0,
        scale: 0.98,
        duration: 1.1,
        ease: "power4.out",
        delay: 0.5,
      })

      // Console rows reveal
      gsap.from(".hero-row", {
        y: 12,
        opacity: 0,
        duration: 0.55,
        ease: "power3.out",
        stagger: 0.08,
        delay: 1.0,
      })

      // Floating chips
      gsap.from(".hero-chip", {
        y: 20,
        opacity: 0,
        scale: 0.9,
        duration: 0.7,
        ease: "back.out(1.6)",
        stagger: 0.12,
        delay: 1.2,
      })
      gsap.to(".hero-chip", {
        y: "+=8",
        duration: 3.2,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        stagger: { each: 0.4, from: "random" },
      })

      // Status pulse
      gsap.to(".pulse-dot", {
        scale: 1.6,
        opacity: 0,
        duration: 1.4,
        ease: "power2.out",
        repeat: -1,
      })
    }, root)

    return () => ctx.revert()
  }, [])

  const headline = ["Your", "API", "is", "lying.", "We", "prove", "it."]

  return (
    <section ref={root} className="relative isolate overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28">
      {/* Grid backdrop */}
      <div aria-hidden className="pointer-events-none absolute inset-0 grid-bg grid-bg-fade" />
      {/* Glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-primary/20 blur-[120px] opacity-60 dark:opacity-40"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 noise opacity-[0.04] mix-blend-overlay"
      />

      <div className="relative mx-auto max-w-6xl px-4">
        {/* Eyebrow */}
        <div className="flex justify-center">
          <div className="hero-eyebrow inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <span className="relative flex size-1.5">
              <span className="pulse-dot absolute inset-0 rounded-full bg-primary" />
              <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
            </span>
            <span>v1.0 — out of beta. Stateful checks. Schema validation. AI baselines.</span>
            <ChevronRight className="size-3" />
          </div>
        </div>

        {/* Headline */}
        <h1 className="mx-auto mt-7 max-w-5xl text-center text-balance font-sans text-[40px] leading-[1.05] font-semibold tracking-tight md:text-7xl">
          {headline.map((w, i) => (
            <span
              key={i}
              className={`hero-word inline-block ${
                w === "lying." ? "text-primary italic font-serif" : ""
              }`}
            >
              {w}
              {i < headline.length - 1 && <span>&nbsp;</span>}
            </span>
          ))}
        </h1>

        <p className="hero-sub mx-auto mt-6 max-w-2xl text-center text-pretty text-base text-muted-foreground md:text-lg">
          A 200 OK doesn&apos;t mean it works. Probe runs stateful, multi-step API checks with schema
          validation, embedded security scans, and AI-driven performance baselines — so you find
          out before your users do.
        </p>

        <div className="hero-cta mt-9 flex items-center justify-center gap-3">
          <Button asChild size="lg" className="rounded-full">
            <Link href="#start">
              Start monitoring free <ArrowRight className="ml-1.5 size-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="rounded-full bg-transparent">
            <Link href="#code">
              <span className="font-mono">$</span>&nbsp;curl probe.dev | sh
            </Link>
          </Button>
        </div>

        <p className="hero-sub mt-4 text-center text-xs text-muted-foreground">
          No credit card · 1k checks free · Deploy in &lt; 60s
        </p>

        {/* Console preview */}
        <div className="hero-console relative mx-auto mt-16 max-w-5xl">
          <ConsolePreview />

          {/* Floating chips */}
          <div className="hero-chip absolute -left-4 top-10 hidden md:flex items-center gap-2 rounded-xl border border-border/70 bg-background/90 px-3 py-2 text-xs shadow-xl backdrop-blur">
            <Shield className="size-3.5 text-primary" />
            <span className="font-medium">CSP header missing</span>
            <span className="text-muted-foreground">/v2/users</span>
          </div>
          <div className="hero-chip absolute -right-6 top-28 hidden md:flex items-center gap-2 rounded-xl border border-border/70 bg-background/90 px-3 py-2 text-xs shadow-xl backdrop-blur">
            <Activity className="size-3.5 text-primary" />
            <span className="font-medium">p95 latency drift</span>
            <span className="text-muted-foreground">+412%</span>
          </div>
          <div className="hero-chip absolute -right-2 -bottom-4 hidden md:flex items-center gap-2 rounded-xl border border-border/70 bg-background/90 px-3 py-2 text-xs shadow-xl backdrop-blur">
            <Workflow className="size-3.5 text-primary" />
            <span className="font-medium">3-step flow passed</span>
            <span className="text-muted-foreground">login → fetch → logout</span>
          </div>
        </div>
      </div>
    </section>
  )
}

function ConsolePreview() {
  const rows = [
    {
      method: "POST",
      path: "/v2/auth/login",
      status: 200,
      ms: 142,
      tags: ["extracted: token"],
      ok: true,
    },
    {
      method: "GET",
      path: "/v2/users/me",
      status: 200,
      ms: 88,
      tags: ["schema ✓", "header ✓"],
      ok: true,
    },
    {
      method: "GET",
      path: "/v2/billing/plan",
      status: 200,
      ms: 612,
      tags: ["schema ✗ — expected int, got string"],
      ok: false,
    },
    {
      method: "POST",
      path: "/v2/orders",
      status: 200,
      ms: 71,
      tags: ["security ✗ — XSS reflected"],
      ok: false,
    },
    {
      method: "DELETE",
      path: "/v2/sessions",
      status: 204,
      ms: 39,
      tags: ["schema ✓"],
      ok: true,
    },
  ]

  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-card/70 shadow-2xl backdrop-blur-xl">
      {/* window chrome */}
      <div className="flex items-center justify-between border-b border-border/70 bg-muted/40 px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-destructive/70" />
          <span className="size-2.5 rounded-full bg-yellow-500/70" />
          <span className="size-2.5 rounded-full bg-primary/80" />
        </div>
        <div className="flex items-center gap-2 rounded-md border border-border/60 bg-background/60 px-3 py-1 text-[11px] text-muted-foreground font-mono">
          probe run --flow checkout-suite.yaml
        </div>
        <div className="text-[11px] font-mono text-muted-foreground">5 / 5 checks</div>
      </div>

      <div className="grid md:grid-cols-[1fr_280px]">
        {/* Rows */}
        <div className="divide-y divide-border/60">
          {rows.map((r, i) => (
            <div
              key={i}
              className="hero-row group flex items-center justify-between gap-4 px-4 py-3 text-sm hover:bg-muted/40 transition-colors"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className={`size-2 rounded-full ${
                    r.ok ? "bg-primary" : "bg-destructive"
                  }`}
                  aria-hidden
                />
                <span
                  className={`shrink-0 rounded-md border px-1.5 py-0.5 font-mono text-[10px] ${
                    r.method === "GET"
                      ? "border-border text-muted-foreground"
                      : r.method === "POST"
                      ? "border-primary/40 text-primary"
                      : "border-border text-foreground"
                  }`}
                >
                  {r.method}
                </span>
                <span className="truncate font-mono text-[13px]">{r.path}</span>
              </div>
              <div className="flex shrink-0 items-center gap-3 text-[12px] text-muted-foreground">
                <span className="hidden md:inline-flex flex-wrap gap-1.5">
                  {r.tags.map((t, j) => (
                    <span
                      key={j}
                      className={`rounded-md border px-1.5 py-0.5 font-mono text-[10px] ${
                        t.includes("✗")
                          ? "border-destructive/40 text-destructive"
                          : "border-border/70 text-muted-foreground"
                      }`}
                    >
                      {t}
                    </span>
                  ))}
                </span>
                <span className="font-mono">{r.ms}ms</span>
                <span
                  className={`font-mono tabular-nums ${
                    r.ok ? "text-primary" : "text-destructive"
                  }`}
                >
                  {r.status}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Side panel */}
        <div className="hidden md:flex flex-col border-l border-border/60 bg-muted/20 p-4">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Run summary</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-semibold tabular-nums">2</span>
            <span className="text-sm text-destructive">failed</span>
          </div>
          <div className="mt-1 text-xs text-muted-foreground">3 passed · 0 skipped · 952ms total</div>

          <div className="mt-4 grid grid-cols-2 gap-2 text-[11px]">
            <div className="rounded-lg border border-border/60 bg-background/60 p-2">
              <div className="text-muted-foreground">p50</div>
              <div className="font-mono text-sm">88ms</div>
            </div>
            <div className="rounded-lg border border-border/60 bg-background/60 p-2">
              <div className="text-muted-foreground">p95</div>
              <div className="font-mono text-sm text-destructive">612ms</div>
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-border/60 bg-background/60 p-3">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">AI baseline</div>
            <div className="mt-1 text-xs">
              <span className="text-destructive font-medium">Anomaly:</span>{" "}
              <span className="text-muted-foreground">/billing/plan up 412% vs Tue 09:00 baseline.</span>
            </div>
          </div>

          <Button size="sm" variant="outline" className="mt-4 rounded-full bg-transparent">
            Open run
            <ArrowRight className="ml-1 size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
