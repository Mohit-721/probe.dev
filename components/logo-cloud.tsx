"use client"

import * as React from "react"
import { gsap, ScrollTrigger, prefersReducedMotion } from "@/lib/gsap"

const COMPANIES = [
  { name: "ACME", tag: "fintech" },
  { name: "Northwind", tag: "logistics" },
  { name: "Linear", tag: "issue tracking" },
  { name: "Stripe", tag: "payments" },
  { name: "Helio", tag: "infra" },
  { name: "Forge", tag: "devops" },
  { name: "Lattice", tag: "hr" },
  { name: "Vector", tag: "search" },
  { name: "Atlas", tag: "maps" },
  { name: "Quanta", tag: "ml" },
  { name: "Beacon", tag: "comms" },
  { name: "Orbit", tag: "satcom" },
]

// Duplicate the row twice to create a seamless loop
const ROW = [...COMPANIES, ...COMPANIES]

export function LogoCloud() {
  const root = React.useRef<HTMLDivElement>(null)
  const trackA = React.useRef<HTMLDivElement>(null)
  const trackB = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!root.current) return
    const ctx = gsap.context(() => {
      // Reveal
      gsap.from(".lc-eyebrow > *", {
        scrollTrigger: { trigger: root.current, start: "top 85%" },
        y: 12,
        opacity: 0,
        duration: 0.7,
        stagger: 0.06,
        ease: "power3.out",
      })

      // Skip marquee if reduced motion
      if (prefersReducedMotion()) return

      // Infinite marquee — opposite directions for visual depth
      const a = trackA.current
      const b = trackB.current
      if (a) {
        gsap.fromTo(a, { xPercent: 0 }, { xPercent: -50, duration: 36, ease: "none", repeat: -1 })
      }
      if (b) {
        gsap.fromTo(b, { xPercent: -50 }, { xPercent: 0, duration: 44, ease: "none", repeat: -1 })
      }
    }, root)

    return () => {
      ctx.revert()
      ScrollTrigger.getAll().forEach((s) => s.kill())
    }
  }, [])

  return (
    <section ref={root} className="relative border-y border-border/60 bg-muted/20 py-12 md:py-16">
      <div className="mx-auto max-w-6xl px-4">
        {/* Eyebrow */}
        <div className="lc-eyebrow flex flex-col items-center gap-3 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/60 px-3 py-1 text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
            <span className="size-1.5 rounded-full bg-primary shadow-[0_0_6px_var(--primary)]" />
            powering 14,000+ probes / sec
          </span>
          <p className="text-sm text-muted-foreground">
            Engineering teams shipping to production with Probe at the front line
          </p>
        </div>

        {/* Marquee — two rows in opposite directions, edge-masked */}
        <div className="mt-8 space-y-3 md:mt-10 md:space-y-4">
          <Row trackRef={trackA} dim />
          <Row trackRef={trackB} />
        </div>
      </div>
    </section>
  )
}

function Row({
  trackRef,
  dim = false,
}: {
  trackRef: React.RefObject<HTMLDivElement | null>
  dim?: boolean
}) {
  return (
    <div className="ticker-mask overflow-hidden">
      <div ref={trackRef} className="flex w-max items-center gap-8 will-change-transform">
        {ROW.map((c, i) => (
          <LogoChip key={`${c.name}-${i}`} name={c.name} tag={c.tag} dim={dim} />
        ))}
      </div>
    </div>
  )
}

function LogoChip({ name, tag, dim }: { name: string; tag: string; dim?: boolean }) {
  return (
    <div
      className={
        "group inline-flex shrink-0 items-center gap-3 rounded-xl border border-border/60 bg-background/40 px-4 py-2.5 transition-colors hover:border-primary/40 hover:bg-card " +
        (dim ? "opacity-70 hover:opacity-100" : "")
      }
    >
      <span aria-hidden className="font-mono text-[11px] text-muted-foreground/80 group-hover:text-primary">
        {"//"}
      </span>
      <span className="font-sans text-sm font-medium tracking-tight text-foreground">{name}</span>
      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {tag}
      </span>
    </div>
  )
}
