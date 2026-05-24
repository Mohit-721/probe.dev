"use client"

import * as React from "react"
import { gsap } from "@/lib/gsap"
import { Activity, CheckCircle2, ShieldAlert, Siren } from "lucide-react"
import { cn } from "@/lib/utils"
import { LatencyChart } from "@/components/dashboard/latency-chart"
import type { Monitor, Run, Incident } from "@/lib/types"

type RunPart = Pick<Run, "id" | "status" | "duration_ms" | "started_at" | "completed_at">
type IncidentPart = Pick<Incident, "id" | "title" | "summary" | "status" | "severity" | "opened_at" | "resolved_at">

export function StatusBoard({
  monitor,
  runs,
  incidents,
}: {
  monitor: Monitor
  runs: RunPart[]
  incidents: IncidentPart[]
}) {
  const root = React.useRef<HTMLElement | null>(null)
  const ringRef = React.useRef<SVGCircleElement | null>(null)
  const numberRef = React.useRef<HTMLSpanElement | null>(null)

  const successCount = runs.filter((r) => r.status === "success").length
  const uptime = runs.length > 0 ? (successCount / runs.length) * 100 : 100
  const avgLatency =
    runs.length > 0 ? Math.round(runs.reduce((acc, r) => acc + (r.duration_ms ?? 0), 0) / runs.length) : 0

  const overallStatus: "operational" | "degraded" | "outage" =
    monitor.last_status === "failed" ? "outage" : monitor.last_status === "degraded" ? "degraded" : "operational"

  const statusCopy = {
    operational: { title: "All systems operational", desc: "No active incidents.", color: "var(--primary)" },
    degraded: { title: "Degraded performance", desc: "Some probes are slow.", color: "#f59e0b" },
    outage: { title: "Service disruption", desc: "An incident is currently open.", color: "var(--destructive)" },
  } as const

  const cfg = statusCopy[overallStatus]

  React.useEffect(() => {
    const ctx = gsap.context(() => {
      // Reveal everything
      gsap.from("[data-reveal]", {
        y: 16,
        opacity: 0,
        stagger: 0.06,
        duration: 0.7,
        ease: "power3.out",
      })

      // Single batched stagger for all 90 cells (one tween instead of 90)
      gsap.from("[data-cell]", {
        opacity: 0,
        scale: 0.6,
        y: 4,
        duration: 0.4,
        ease: "power2.out",
        stagger: { each: 0.005, from: "start" },
      })

      // Animate the SLO ring
      if (ringRef.current) {
        const r = Number(ringRef.current.getAttribute("r"))
        const c = 2 * Math.PI * r
        ringRef.current.style.strokeDasharray = String(c)
        gsap.fromTo(
          ringRef.current,
          { strokeDashoffset: c },
          {
            strokeDashoffset: c - (uptime / 100) * c,
            duration: 1.4,
            ease: "power3.out",
          },
        )
      }

      // Counter animation
      if (numberRef.current) {
        const target = uptime
        const obj = { v: 0 }
        gsap.to(obj, {
          v: target,
          duration: 1.4,
          ease: "power3.out",
          onUpdate: () => {
            if (numberRef.current) numberRef.current.textContent = obj.v.toFixed(2)
          },
        })
      }
    }, root)
    return () => ctx.revert()
  }, [uptime])

  // Build 90-cell strip (older → newer)
  const strip = React.useMemo(() => {
    const arr = new Array(90).fill(null) as Array<RunPart | null>
    runs
      .slice()
      .reverse()
      .forEach((r, i) => {
        if (i < 90) arr[90 - runs.length + i] = r
      })
    return arr
  }, [runs])

  return (
    <main ref={root} className="relative">
      {/* Decorative grid */}
      <div aria-hidden className="pointer-events-none absolute inset-0 grid-bg opacity-[0.5]" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(ellipse_at_top,color-mix(in_oklch,var(--primary)_18%,transparent),transparent_70%)]"
      />

      <div className="relative mx-auto max-w-5xl px-4 py-10 md:px-6 md:py-16">
        {/* Hero */}
        <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
          <div data-reveal>
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/60 px-3 py-1 text-xs font-medium backdrop-blur">
              <span
                className="size-1.5 rounded-full"
                style={{ backgroundColor: cfg.color, boxShadow: `0 0 8px ${cfg.color}` }}
              />
              <span className="font-mono uppercase tracking-wider text-muted-foreground">{overallStatus}</span>
            </div>
            <h1 className="mt-4 text-balance font-sans text-3xl font-semibold tracking-tight md:text-5xl">
              {cfg.title}
            </h1>
            <p className="mt-3 text-balance text-base text-muted-foreground">
              {cfg.desc} Live status of <span className="font-medium text-foreground">{monitor.name}</span>.
            </p>
          </div>

          <SLORing uptime={uptime} ringRef={ringRef} numberRef={numberRef} color={cfg.color} />
        </div>

        {/* KPIs */}
        <div data-reveal className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          <Kpi
            icon={CheckCircle2}
            label="Last status"
            value={monitor.last_status ?? "—"}
            tone={overallStatus === "operational" ? "primary" : overallStatus === "outage" ? "destructive" : "warn"}
          />
          <Kpi icon={Activity} label="Avg latency" value={`${avgLatency}ms`} mono />
          <Kpi
            icon={ShieldAlert}
            label="Open incidents"
            value={incidents.filter((i) => i.status === "open").length.toString()}
            tone={incidents.some((i) => i.status === "open") ? "destructive" : "primary"}
          />
          <Kpi icon={Siren} label="Schedule" value={monitor.schedule} mono />
        </div>

        {/* 90-day strip */}
        <section data-reveal className="mt-10 rounded-2xl border border-border bg-card/60 p-5 backdrop-blur">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="flex items-center gap-2">
              <div>
                <h2 className="text-sm font-medium">Last 90 probes</h2>
                <p className="text-xs text-muted-foreground">Each tile is a single probe · oldest left, newest right</p>
              </div>
              <LiveIndicator />
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono text-muted-foreground">
              <Legend color="var(--primary)" label="success" />
              <Legend color="var(--destructive)" label="failed" />
              <Legend color="color-mix(in oklch, var(--foreground) 12%, transparent)" label="no data" />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-[repeat(30,minmax(0,1fr))] gap-[3px] sm:grid-cols-[repeat(45,minmax(0,1fr))] md:grid-cols-[repeat(90,minmax(0,1fr))]">
            {strip.map((r, i) => (
              <Cell key={i} run={r} />
            ))}
          </div>
        </section>

        {/* Latency */}
        <section data-reveal className="mt-6 rounded-2xl border border-border bg-card/60 p-5 backdrop-blur">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-sm font-medium">Latency</h2>
              <p className="text-xs text-muted-foreground">Response time over the recent window</p>
            </div>
          </div>
          <div className="mt-4">
            <LatencyChart
              points={runs.map((r) => ({
                t: new Date(r.started_at).getTime(),
                ms: r.duration_ms ?? 0,
                status: r.status,
              }))}
            />
          </div>
        </section>

        {/* Incidents */}
        <section data-reveal className="mt-6 rounded-2xl border border-border bg-card/60 p-5 backdrop-blur">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-medium">Incident history</h2>
              <p className="text-xs text-muted-foreground">Last 20 events · most recent first</p>
            </div>
          </div>
          {incidents.length === 0 ? (
            <div className="mt-6 flex items-center gap-3 rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">
              <CheckCircle2 className="size-4 text-primary" />
              No incidents reported. Things have been smooth.
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-border">
              {incidents.map((i) => (
                <li key={i.id} className="grid grid-cols-[100px_1fr_auto] items-start gap-3 py-3 text-sm">
                  <span
                    className={cn(
                      "rounded-md px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider",
                      i.status === "open"
                        ? "bg-destructive/15 text-destructive"
                        : "bg-primary/15 text-primary",
                    )}
                  >
                    {i.status}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate font-medium">{i.title}</div>
                    {i.summary ? (
                      <div className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">{i.summary}</div>
                    ) : null}
                  </div>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {new Date(i.opened_at).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  )
}

function SLORing({
  uptime,
  ringRef,
  numberRef,
  color,
}: {
  uptime: number
  ringRef: React.RefObject<SVGCircleElement | null>
  numberRef: React.RefObject<HTMLSpanElement | null>
  color: string
}) {
  return (
    <div
      data-reveal
      className="relative mx-auto grid size-[180px] place-items-center rounded-full border border-border/70 bg-card/40 backdrop-blur md:size-[220px]"
    >
      <svg viewBox="0 0 200 200" className="absolute inset-0 size-full -rotate-90">
        <circle
          cx="100"
          cy="100"
          r="86"
          fill="none"
          stroke="color-mix(in oklch, var(--foreground) 8%, transparent)"
          strokeWidth="6"
        />
        <circle
          ref={ringRef}
          cx="100"
          cy="100"
          r="86"
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 8px ${color})` }}
        />
      </svg>
      <div className="text-center">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">uptime</div>
        <div className="mt-1 font-sans text-3xl font-semibold tabular-nums md:text-4xl">
          <span ref={numberRef}>0.00</span>
          <span className="text-muted-foreground">%</span>
        </div>
        <div className="mt-1 font-mono text-[10px] text-muted-foreground">last {Math.max(uptime ? 90 : 0, 0) ? "90" : "0"} probes</div>
      </div>
    </div>
  )
}

function Kpi({
  icon: Icon,
  label,
  value,
  tone,
  mono,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  tone?: "primary" | "destructive" | "warn"
  mono?: boolean
}) {
  const toneCls =
    tone === "primary"
      ? "text-primary"
      : tone === "destructive"
        ? "text-destructive"
        : tone === "warn"
          ? "text-amber-500"
          : "text-foreground"
  return (
    <div className="rounded-xl border border-border bg-card/60 p-4 backdrop-blur">
      <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
        {label}
        <Icon className="size-3.5" />
      </div>
      <div className={cn("mt-2 truncate text-lg font-semibold", mono && "font-mono text-base", toneCls)}>{value}</div>
    </div>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="block size-2 rounded-sm" style={{ backgroundColor: color }} />
      {label}
    </span>
  )
}

function Cell({ run }: { run: RunPart | null }) {
  const cls = !run
    ? "bg-foreground/10"
    : run.status === "success"
      ? "bg-primary/80 hover:bg-primary"
      : run.status === "failed"
        ? "bg-destructive/80 hover:bg-destructive"
        : "bg-amber-500/80"

  const title = run
    ? `${run.status.toUpperCase()} · ${run.duration_ms ?? 0}ms · ${new Date(run.started_at).toLocaleString()}`
    : "no data"

  return (
    <div
      data-cell
      title={title}
      className={cn(
        "h-7 w-full cursor-pointer rounded-[3px] transition-transform hover:scale-110",
        run?.status === "success" && "shadow-[0_0_4px_color-mix(in_oklch,var(--primary)_50%,transparent)]",
        cls,
      )}
    />
  )
}

function LiveIndicator({ intervalSeconds = 30 }: { intervalSeconds?: number }) {
  const [remaining, setRemaining] = React.useState(intervalSeconds)
  React.useEffect(() => {
    const id = window.setInterval(() => {
      setRemaining((r) => (r <= 1 ? intervalSeconds : r - 1))
    }, 1000)
    return () => window.clearInterval(id)
  }, [intervalSeconds])

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/60 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground backdrop-blur">
      <span className="relative grid size-1.5 place-items-center">
        <span className="absolute size-full animate-ping rounded-full bg-primary/60" />
        <span className="size-1.5 rounded-full bg-primary shadow-[0_0_6px_var(--primary)]" />
      </span>
      live · {remaining}s
    </span>
  )
}
