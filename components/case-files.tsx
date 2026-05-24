"use client"

import * as React from "react"
import { gsap, ScrollTrigger } from "@/lib/gsap"
import {
  FileWarning,
  GitPullRequestArrow,
  KeyRound,
  ShieldAlert,
  Terminal,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"

type Tone = "default" | "muted" | "ok" | "fail" | "warn"
type Line =
  | { kind: "cmd"; text: string }
  | { kind: "out"; text: string; tone?: Tone }
  | { kind: "comment"; text: string }
  | { kind: "rule" }

type Case = {
  number: string
  filename: string
  title: string
  subtitle: string
  badge: string
  duration: string
  region: string
  icon: React.ComponentType<{ className?: string }>
  lesson: { eyebrow: string; body: string }
  lines: Line[]
}

const CASES: Case[] = [
  {
    number: "01",
    filename: "incidents/case-01.log",
    title: "The 200 OK lie",
    subtitle: "Status code lied. Database was already gone.",
    badge: "RESOLVED",
    duration: "4m 12s",
    region: "iad1",
    icon: FileWarning,
    lesson: {
      eyebrow: "the lesson",
      body: "Status codes describe transport, not truth. Probe asserts on response shape — not the signal at the wire.",
    },
    lines: [
      { kind: "comment", text: "# 03:14 — pager fires from /orders, but legacy monitor is green" },
      { kind: "cmd", text: "$ curl -is https://api.acme.test/v1/orders | head -n 4" },
      { kind: "out", text: "HTTP/1.1 200 OK", tone: "ok" },
      { kind: "out", text: "content-type: application/json", tone: "muted" },
      { kind: "out", text: 'x-db-state: reconnecting', tone: "muted" },
      { kind: "out", text: '{"orders":[],"_meta":{"source":"cache-stale"}}' },
      { kind: "rule" },
      { kind: "cmd", text: "$ probe run case-01.yaml --assert orders.length >= 1" },
      { kind: "out", text: "✗ assert orders.length >= 1 → got 0", tone: "fail" },
      { kind: "out", text: "✗ assert _meta.source != 'cache-stale' → got 'cache-stale'", tone: "fail" },
      { kind: "out", text: "✓ alert dispatched · pager · slack#incidents · 84ms", tone: "ok" },
    ],
  },
  {
    number: "02",
    filename: "incidents/case-02.log",
    title: "The auth chain broke",
    subtitle: "Token refresh silently failed. Single-step pings never noticed.",
    badge: "RESOLVED",
    duration: "11m 02s",
    region: "fra1",
    icon: KeyRound,
    lesson: {
      eyebrow: "the lesson",
      body: "Real users don't make one request. They make eight. Probe walks the full state machine — login, refresh, fetch, mutate.",
    },
    lines: [
      { kind: "comment", text: "# multi-step flow with token chained between steps" },
      { kind: "cmd", text: "$ probe flow checkout.yaml --trace" },
      { kind: "out", text: "→ step 1/4  POST /auth/login          200  124ms", tone: "ok" },
      { kind: "out", text: "  ↳ extracted: $.access_token  $.refresh_token", tone: "muted" },
      { kind: "out", text: "→ step 2/4  POST /auth/refresh        401  061ms", tone: "fail" },
      { kind: "out", text: "  ↳ body: { error: 'rotation_window_expired' }", tone: "muted" },
      { kind: "rule" },
      { kind: "out", text: "✗ flow halted at step 2 · downstream skipped", tone: "fail" },
      { kind: "out", text: "✓ incident opened · linked to deploy a4f7c2 · runbook attached", tone: "ok" },
    ],
  },
  {
    number: "03",
    filename: "incidents/case-03.log",
    title: "The schema drifted",
    subtitle: "Field renamed in a hotfix. Mobile clients stopped parsing.",
    badge: "RESOLVED",
    duration: "2m 39s",
    region: "syd1",
    icon: GitPullRequestArrow,
    lesson: {
      eyebrow: "the lesson",
      body: "Contract changes belong in code review, not in a 3am Sentry burst. Probe asserts JSON schema on every probe.",
    },
    lines: [
      { kind: "comment", text: "# probe diff against committed schema/orders.json" },
      { kind: "cmd", text: "$ probe schema check orders --against main" },
      { kind: "out", text: "Validating 12 fields × 1 200 sample responses", tone: "muted" },
      { kind: "out", text: "✓ id          string          required", tone: "ok" },
      { kind: "out", text: "✓ total_cents integer ≥ 0     required", tone: "ok" },
      { kind: "out", text: "✗ customer    expected object got null", tone: "fail" },
      { kind: "out", text: "✗ customerId  field renamed → customer_id", tone: "fail" },
      { kind: "rule" },
      { kind: "out", text: "✓ PR #2841 blocked · review requested · 2 contracts changed", tone: "ok" },
    ],
  },
  {
    number: "04",
    filename: "incidents/case-04.log",
    title: "The TLS rot",
    subtitle: "Cert auto-renewed to a weaker chain. Nobody noticed for 6 days.",
    badge: "RESOLVED",
    duration: "0m 44s",
    region: "gru1",
    icon: ShieldAlert,
    lesson: {
      eyebrow: "the lesson",
      body: "Security drift looks identical to a healthy response. Probe runs an embedded scan on every check, not once a quarter.",
    },
    lines: [
      { kind: "comment", text: "# every probe also runs a header + TLS audit" },
      { kind: "cmd", text: "$ probe security audit api.acme.test" },
      { kind: "out", text: "→ TLS 1.3 · A · ECDHE-X25519", tone: "ok" },
      { kind: "out", text: "→ HSTS preload · max-age=31536000", tone: "ok" },
      { kind: "out", text: "→ CSP · default-src 'self'", tone: "ok" },
      { kind: "out", text: "✗ chain depth 3 · intermediate cert sha-1 signed", tone: "fail" },
      { kind: "out", text: "✗ x-frame-options missing · clickjack risk", tone: "fail" },
      { kind: "rule" },
      { kind: "out", text: "✓ ticket opened · sec#critical · runbook /tls-rotate", tone: "ok" },
    ],
  },
]

export function CaseFiles() {
  const root = React.useRef<HTMLElement | null>(null)
  const stage = React.useRef<HTMLDivElement | null>(null)
  const linesWrap = React.useRef<HTMLDivElement | null>(null)
  const [active, setActive] = React.useState(0)
  const activeRef = React.useRef(0)

  // Pin the stage and drive the active case from scroll progress
  React.useEffect(() => {
    if (!stage.current) return
    const ctx = gsap.context(() => {
      const stages = CASES.length
      // Pin the stage to itself so the pin begins exactly when the stage
      // reaches the top of the viewport (after the heading has scrolled past).
      ScrollTrigger.create({
        trigger: stage.current!,
        start: "top top",
        // ~100vh of scroll per case so each one gets time to read
        end: () => `+=${stages * window.innerHeight * 0.95}`,
        pin: true,
        pinSpacing: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          // Bias progress slightly so the last case settles fully before unpin
          const i = Math.min(
            stages - 1,
            Math.max(0, Math.floor(self.progress * stages * 0.9999)),
          )
          if (i !== activeRef.current) {
            activeRef.current = i
            setActive(i)
          }
        },
      })

      // Heading reveal
      gsap.from(".cf-head > *", {
        scrollTrigger: { trigger: ".cf-head", start: "top 85%" },
        y: 18,
        opacity: 0,
        duration: 0.7,
        ease: "power3.out",
        stagger: 0.08,
      })
    }, root)
    return () => ctx.revert()
  }, [])

  // Re-stagger console lines when active case changes
  React.useEffect(() => {
    if (!linesWrap.current) return
    const lines = linesWrap.current.querySelectorAll<HTMLElement>("[data-line]")
    gsap.fromTo(
      lines,
      { opacity: 0, x: -10 },
      {
        opacity: 1,
        x: 0,
        duration: 0.35,
        ease: "power2.out",
        stagger: 0.04,
        overwrite: true,
      },
    )

    // Caret blink reset
    const caret = linesWrap.current.querySelector<HTMLElement>("[data-caret]")
    if (caret) {
      gsap.fromTo(caret, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "power2.out" })
    }
  }, [active])

  const c = CASES[active]
  const Icon = c.icon

  return (
    <section ref={root} className="relative bg-background">
      {/* Pinned stage — heading lives INSIDE so heading + terminal stay together while pinned */}
      <div ref={stage} className="relative h-svh w-full overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0 grid-bg grid-bg-fade opacity-40" />

        <div className="relative mx-auto flex h-full max-w-6xl flex-col px-4 pb-6 pt-20 md:pt-24">
          {/* Compact heading */}
          <div className="cf-head shrink-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
              <Terminal className="size-3.5 text-primary" />
              /var/log/probe — case files
            </div>
            <h2 className="mt-3 max-w-3xl text-balance font-sans text-2xl font-semibold tracking-tight md:text-4xl">
              Four real incidents.{" "}
              <span className="text-muted-foreground">Four reasons</span> legacy uptime tools missed every one.
            </h2>
            <p className="mt-2 hidden max-w-xl text-pretty text-sm text-muted-foreground md:block">
              Scroll to step through. Each case is a real probe pattern.
            </p>
          </div>

          {/* Stage content fills remaining space */}
          <div className="mt-5 grid min-h-0 flex-1 gap-4 md:mt-6 lg:grid-cols-[140px_1fr] lg:gap-6">
            {/* Case rail */}
            <ol className="hidden flex-col gap-2 lg:flex" aria-label="Cases">
              {CASES.map((cc, i) => {
                const isActive = i === active
                const isPast = i < active
                return (
                  <li key={cc.number}>
                    <button
                      type="button"
                      onClick={() => setActive(i)}
                      className={cn(
                        "group relative w-full overflow-hidden rounded-lg border border-border/70 bg-card/60 p-3 text-left transition-colors",
                        isActive && "border-primary/60 bg-card",
                        !isActive && "hover:bg-card",
                      )}
                      aria-current={isActive ? "true" : undefined}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={cn(
                            "font-mono text-[10px] tracking-wider",
                            isActive ? "text-primary" : "text-muted-foreground",
                          )}
                        >
                          {cc.number}
                        </span>
                        <span
                          className={cn(
                            "size-1.5 rounded-full transition-all",
                            isActive
                              ? "bg-primary shadow-[0_0_8px_var(--primary)]"
                              : isPast
                                ? "bg-primary/50"
                                : "bg-foreground/20",
                          )}
                        />
                      </div>
                      <div
                        className={cn(
                          "mt-2 line-clamp-2 text-[12px] leading-snug",
                          isActive ? "text-foreground" : "text-muted-foreground",
                        )}
                      >
                        {cc.title}
                      </div>
                    </button>
                  </li>
                )
              })}
            </ol>

            {/* Mobile pill rail */}
            <ol className="flex gap-2 overflow-x-auto pb-1 lg:hidden" aria-label="Cases (mobile)">
              {CASES.map((cc, i) => {
                const isActive = i === active
                return (
                  <li key={cc.number} className="shrink-0">
                    <button
                      type="button"
                      onClick={() => setActive(i)}
                      className={cn(
                        "rounded-full border px-3 py-1 font-mono text-[11px] transition-colors",
                        isActive
                          ? "border-primary/60 bg-primary/10 text-primary"
                          : "border-border bg-card/60 text-muted-foreground",
                      )}
                    >
                      {cc.number} · {cc.title.toLowerCase()}
                    </button>
                  </li>
                )
              })}
            </ol>

            {/* Terminal */}
            <div className="relative">
              <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-2xl">
                {/* Title bar */}
                <div className="flex items-center justify-between gap-3 border-b border-border/70 bg-muted/40 px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full bg-foreground/15" />
                    <span className="size-2.5 rounded-full bg-foreground/15" />
                    <span className="size-2.5 rounded-full bg-foreground/15" />
                    <span className="ml-3 font-mono text-[11px] text-muted-foreground">
                      {c.filename}
                    </span>
                  </div>
                  <div className="hidden items-center gap-2 sm:flex">
                    <span className="rounded-md border border-primary/30 bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] text-primary">
                      {c.badge}
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {c.duration} · {c.region}
                    </span>
                  </div>
                </div>

                {/* Subtitle row */}
                <div className="flex items-center justify-between gap-3 border-b border-border/60 bg-card px-4 py-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="grid size-7 place-items-center rounded-md border border-primary/30 bg-primary/10">
                        <Icon className="size-3.5 text-primary" />
                      </span>
                      <div className="truncate font-sans text-sm font-semibold">{c.title}</div>
                    </div>
                    <div className="mt-1.5 truncate text-[12px] text-muted-foreground">
                      {c.subtitle}
                    </div>
                  </div>
                  <div className="hidden font-mono text-[10px] uppercase tracking-wider text-muted-foreground sm:block">
                    case {active + 1} of {CASES.length}
                  </div>
                </div>

                {/* Console body */}
                <div
                  ref={linesWrap}
                  key={c.number}
                  className="relative max-h-[34vh] overflow-y-auto px-4 py-4 font-mono text-[12.5px] leading-relaxed md:max-h-[38vh] md:text-[13px]"
                  aria-live="polite"
                >
                  {c.lines.map((line, i) => (
                    <LineRow key={i} line={line} />
                  ))}
                  <div className="mt-1 flex items-center gap-1.5 text-muted-foreground">
                    <span className="text-primary">$</span>
                    <span data-caret className="inline-block h-3 w-[7px] bg-primary/80" />
                  </div>
                </div>

                {/* Lesson */}
                <div className="border-t border-border/70 bg-gradient-to-br from-primary/5 to-transparent px-4 py-3.5">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-md border border-primary/30 bg-primary/10">
                      <Sparkles className="size-3 text-primary" />
                    </span>
                    <div>
                      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
                        {c.lesson.eyebrow}
                      </div>
                      <div className="mt-0.5 text-pretty text-[13px] text-foreground">
                        {c.lesson.body}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress dots — bottom of stage */}
              <div className="mt-4 flex items-center justify-center gap-2">
                {CASES.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActive(i)}
                    aria-label={`Go to case ${i + 1}`}
                    className={cn(
                      "h-1 rounded-full transition-all",
                      i === active ? "w-8 bg-primary" : "w-2 bg-foreground/20 hover:bg-foreground/40",
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function LineRow({ line }: { line: Line }) {
  if (line.kind === "rule") {
    return (
      <div data-line className="my-2 border-t border-dashed border-border/60" aria-hidden />
    )
  }
  if (line.kind === "comment") {
    return (
      <div data-line className="text-muted-foreground/80">
        {line.text}
      </div>
    )
  }
  if (line.kind === "cmd") {
    return (
      <div data-line className="text-foreground">
        <span className="text-primary">{line.text.slice(0, 1)}</span>
        {line.text.slice(1)}
      </div>
    )
  }
  const tone = line.tone ?? "default"
  return (
    <div
      data-line
      className={cn(
        tone === "muted" && "text-muted-foreground",
        tone === "ok" && "text-primary",
        tone === "fail" && "text-destructive",
        tone === "warn" && "text-amber-500",
        tone === "default" && "text-foreground/90",
      )}
    >
      {line.text}
    </div>
  )
}
