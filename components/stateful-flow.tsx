"use client"

import * as React from "react"
import { gsap, ScrollTrigger } from "@/lib/gsap"
import { ArrowRight, KeyRound, User, ShoppingCart, LogOut, Variable, GitBranch } from "lucide-react"

const STEPS = [
  {
    n: 1,
    icon: KeyRound,
    method: "POST",
    path: "/auth/login",
    note: "extract `token` from $.data.access_token",
  },
  {
    n: 2,
    icon: User,
    method: "GET",
    path: "/users/me",
    note: "Authorization: Bearer {{token}}",
  },
  {
    n: 3,
    icon: ShoppingCart,
    method: "GET",
    path: "/orders?user_id={{me.id}}",
    note: "validate against orders.schema.json",
  },
  {
    n: 4,
    icon: LogOut,
    method: "DELETE",
    path: "/sessions/{{token}}",
    note: "expect 204, no body",
  },
]

export function StatefulFlow() {
  const root = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!root.current) return
    const ctx = gsap.context(() => {
      gsap.from(".flow-head > *", {
        scrollTrigger: { trigger: ".flow-head", start: "top 80%" },
        y: 20,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
        stagger: 0.08,
      })

      gsap.from(".flow-step", {
        scrollTrigger: { trigger: ".flow-track", start: "top 75%" },
        y: 30,
        opacity: 0,
        duration: 0.7,
        ease: "power3.out",
        stagger: 0.12,
      })

      // Draw connecting line
      gsap.fromTo(
        ".flow-line",
        { scaleX: 0 },
        {
          scaleX: 1,
          transformOrigin: "left",
          duration: 1.2,
          ease: "power2.out",
          scrollTrigger: { trigger: ".flow-track", start: "top 70%" },
        }
      )

      // Animated traveler dot
      gsap.fromTo(
        ".flow-traveler",
        { left: "0%", opacity: 0 },
        {
          left: "100%",
          opacity: 1,
          duration: 3.6,
          ease: "power1.inOut",
          repeat: -1,
          scrollTrigger: { trigger: ".flow-track", start: "top 75%" },
        }
      )
    }, root)
    return () => {
      ctx.revert()
      ScrollTrigger.getAll().forEach((s) => s.kill())
    }
  }, [])

  return (
    <section ref={root} className="relative py-24 md:py-32">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-1/2 h-[400px] -translate-y-1/2 bg-gradient-to-b from-transparent via-primary/5 to-transparent"
      />
      <div className="relative mx-auto max-w-6xl px-4">
        <div className="flow-head grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground">
              <GitBranch className="size-3" />
              Stateful flows
            </div>
            <h2 className="mt-4 max-w-2xl text-balance text-3xl font-semibold tracking-tight md:text-5xl">
              APIs don&apos;t live alone. Your tests shouldn&apos;t either.
            </h2>
          </div>
          <p className="max-w-md text-pretty text-muted-foreground">
            Chain requests, extract variables from any JSON path, branch on responses. Probe runs the
            real journey — login, fetch, mutate, sign out — exactly as a user would.
          </p>
        </div>

        {/* Track */}
        <div className="flow-track relative mt-16">
          {/* connecting line */}
          <div className="flow-line absolute left-6 right-6 top-[44px] hidden h-px bg-gradient-to-r from-primary/40 via-primary to-primary/40 md:block" />
          <div className="flow-traveler absolute top-[44px] hidden size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_24px_4px_color-mix(in_oklch,var(--primary)_60%,transparent)] md:block" />

          <ol className="grid gap-4 md:grid-cols-4">
            {STEPS.map((s) => (
              <li
                key={s.n}
                className="flow-step relative rounded-2xl border border-border/70 bg-card p-5"
              >
                <div className="flex items-center justify-between">
                  <div className="relative inline-flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <s.icon className="size-4" />
                    <span className="absolute -inset-1 -z-10 rounded-full bg-primary/40 blur-md" />
                  </div>
                  <span className="font-mono text-[11px] text-muted-foreground">step {s.n}</span>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <span className="rounded-md border border-primary/40 bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] text-primary">
                    {s.method}
                  </span>
                  <span className="font-mono text-[13px]">{s.path}</span>
                </div>
                <p className="mt-3 flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
                  <Variable className="size-3 shrink-0" />
                  <span className="truncate">{s.note}</span>
                </p>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card px-3 py-1.5">
            <span className="size-1.5 rounded-full bg-primary" /> JSONPath extraction
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card px-3 py-1.5">
            <ArrowRight className="size-3" /> Conditional branching
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card px-3 py-1.5">
            <Variable className="size-3" /> Variable templating
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card px-3 py-1.5">
            <GitBranch className="size-3" /> Retry &amp; backoff policies
          </span>
        </div>
      </div>
    </section>
  )
}
