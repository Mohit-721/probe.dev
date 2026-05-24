"use client"

import * as React from "react"
import { gsap, ScrollTrigger } from "@/lib/gsap"
import {
  ShieldCheck,
  Workflow,
  FileJson,
  TerminalSquare,
  BrainCircuit,
  Bell,
} from "lucide-react"

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "Continuous security scanning",
    desc: "Beyond uptime. We audit response headers (HSTS, CSP, X-Content-Type), grade TLS cipher suites, and optionally inject SQLi/XSS payloads to verify your WAF.",
    span: "md:col-span-2",
    badge: "security",
  },
  {
    icon: Workflow,
    title: "Stateful, multi-step flows",
    desc: "Hit /auth, extract the bearer token from JSON, chain it into headers, branch on status. Real user journeys — not isolated pings.",
    span: "md:col-span-1",
    badge: "workflows",
  },
  {
    icon: FileJson,
    title: "Strict JSON Schema validation",
    desc: "Drop in your schema.json. We validate every field, every type, every nesting. The moment a backend changes int → string, you get a contract breach alert.",
    span: "md:col-span-1",
    badge: "contracts",
  },
  {
    icon: TerminalSquare,
    title: "Config-as-code & CI gates",
    desc: "Define monitors in monitoring.yaml next to your code. Block deploys on Vercel & GitHub Actions when staging checks fail. PR comments with diffs.",
    span: "md:col-span-2",
    badge: "developer",
  },
  {
    icon: BrainCircuit,
    title: "AI performance baselines",
    desc: "We learn your endpoint's tempo. If /checkout normally responds in 45ms on Tuesday at 09:00 and suddenly takes 400ms — you'll know before the timeout fires.",
    span: "md:col-span-2",
    badge: "intelligence",
  },
  {
    icon: Bell,
    title: "Incident routing & status pages",
    desc: "Slack, Discord, PagerDuty, SMS, webhooks. Auto-generated public status pages with real uptime, real history, real transparency.",
    span: "md:col-span-1",
    badge: "alerts",
  },
]

export function FeatureGrid() {
  const root = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!root.current) return
    const ctx = gsap.context(() => {
      gsap.from(".feat-head > *", {
        scrollTrigger: { trigger: ".feat-head", start: "top 80%" },
        y: 20,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
        stagger: 0.08,
      })
      gsap.from(".feat-card", {
        scrollTrigger: { trigger: ".feat-grid", start: "top 80%" },
        y: 30,
        opacity: 0,
        duration: 0.7,
        ease: "power3.out",
        stagger: 0.08,
      })
    }, root)
    return () => {
      ctx.revert()
      ScrollTrigger.getAll().forEach((s) => s.kill())
    }
  }, [])

  return (
    <section ref={root} id="workflows" className="relative py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-4">
        <div className="feat-head mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground">
            <span className="size-1.5 rounded-full bg-primary" />
            Six pillars
          </div>
          <h2 className="mt-5 text-balance text-3xl font-semibold tracking-tight md:text-5xl">
            One platform, every layer of the stack.
          </h2>
          <p className="mt-5 text-pretty text-muted-foreground md:text-lg">
            Reliability, security, contracts, and performance — observed continuously, from the same
            workflow your code already lives in.
          </p>
        </div>

        <div className="feat-grid mt-14 grid gap-4 md:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className={`feat-card group relative overflow-hidden rounded-2xl border border-border/70 bg-card p-6 transition-colors hover:border-primary/40 ${f.span}`}
            >
              <div className="absolute right-0 top-0 size-32 -translate-y-12 translate-x-12 rounded-full bg-primary/0 blur-3xl transition-all duration-500 group-hover:bg-primary/15" />
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center justify-center rounded-xl border border-border/70 bg-background/60 p-2.5 text-primary">
                    <f.icon className="size-4" />
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    /{f.badge}
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-semibold tracking-tight">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
