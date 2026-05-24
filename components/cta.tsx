"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { gsap, ScrollTrigger } from "@/lib/gsap"
import { MagneticButton } from "@/components/magnetic-button"

export function Cta() {
  const root = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!root.current) return
    const ctx = gsap.context(() => {
      gsap.from(".cta-card", {
        scrollTrigger: { trigger: root.current, start: "top 80%" },
        y: 30,
        opacity: 0,
        duration: 0.9,
        ease: "power3.out",
      })
      gsap.from(".cta-card > *", {
        scrollTrigger: { trigger: root.current, start: "top 80%" },
        y: 14,
        opacity: 0,
        duration: 0.7,
        ease: "power3.out",
        stagger: 0.08,
        delay: 0.15,
      })
    }, root)
    return () => {
      ctx.revert()
      ScrollTrigger.getAll().forEach((s) => s.kill())
    }
  }, [])

  return (
    <section ref={root} id="start" className="relative py-24 md:py-32">
      <div className="mx-auto max-w-5xl px-4">
        <div className="cta-card relative overflow-hidden rounded-3xl border border-border/70 bg-card p-10 text-center md:p-16">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 grid-bg opacity-40"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 size-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/15 blur-3xl"
          />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
              <span className="size-1.5 rounded-full bg-primary" /> Ship with confidence
            </div>
            <h2 className="mx-auto mt-6 max-w-3xl text-balance text-4xl font-semibold tracking-tight md:text-6xl">
              Stop trusting the <span className="text-muted-foreground line-through">200</span>.
              <br />
              Start trusting the <span className="text-primary italic font-serif">truth</span>.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-pretty text-muted-foreground md:text-lg">
              Free for 1,000 checks per month. No credit card. Live monitors in 60 seconds.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <MagneticButton href="/auth/sign-up">
                Create your first flow <ArrowRight className="ml-1.5 size-4" />
              </MagneticButton>
              <Button asChild size="lg" variant="outline" className="rounded-full bg-transparent">
                <Link href="/auth/login">Sign in</Link>
              </Button>
            </div>
            <div className="mt-10 grid grid-cols-3 gap-6 border-t border-border/60 pt-8 text-left md:grid-cols-3">
              <Stat k="1k" label="Free checks / mo" />
              <Stat k="< 60s" label="Time to first monitor" />
              <Stat k="99.999%" label="Probe network uptime" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Stat({ k, label }: { k: string; label: string }) {
  return (
    <div>
      <div className="font-mono text-2xl font-semibold tabular-nums md:text-3xl">{k}</div>
      <div className="text-xs text-muted-foreground md:text-sm">{label}</div>
    </div>
  )
}
