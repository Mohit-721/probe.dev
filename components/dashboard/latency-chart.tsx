"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

type Point = { t: number; ms: number; status: "success" | "failed" | "degraded" | "running" }

const config = {
  ms: { label: "Latency", color: "var(--primary)" },
  threshold: { label: "p95 target", color: "var(--muted-foreground)" },
}

export function LatencyChart({ points }: { points: Point[] }) {
  // Reverse to chronological for the chart
  const data = React.useMemo(
    () =>
      points
        .slice()
        .sort((a, b) => a.t - b.t)
        .map((p) => {
          const d = new Date(p.t)
          const timeStr = isNaN(d.getTime())
            ? "—"
            : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          return {
            time: timeStr,
            ms: p.ms,
            failed: p.status === "failed" ? p.ms : null,
          }
        }),
    [points],
  )

  if (data.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
        No run data yet — once probes execute, latency trends appear here.
      </div>
    )
  }

  return (
    <ChartContainer config={config} className="h-[220px] w-full">
      <AreaChart data={data} margin={{ left: -8, right: 8, top: 12, bottom: 0 }}>
        <defs>
          <linearGradient id="probeFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.45} />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="probeFailFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--destructive)" stopOpacity={0.55} />
            <stop offset="100%" stopColor="var(--destructive)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="color-mix(in oklch, var(--foreground) 8%, transparent)" />
        <XAxis
          dataKey="time"
          axisLine={false}
          tickLine={false}
          tickMargin={8}
          minTickGap={32}
          tick={{ fontSize: 10, fontFamily: "var(--font-mono)", fill: "var(--muted-foreground)" }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          width={36}
          tickFormatter={(v) => `${v}`}
          tick={{ fontSize: 10, fontFamily: "var(--font-mono)", fill: "var(--muted-foreground)" }}
        />
        <ChartTooltip
          cursor={{ stroke: "var(--primary)", strokeWidth: 1, strokeDasharray: "3 3" }}
          content={<ChartTooltipContent labelClassName="font-mono" indicator="line" />}
        />
        <Area
          type="monotone"
          dataKey="ms"
          stroke="var(--primary)"
          strokeWidth={2}
          fill="url(#probeFill)"
          isAnimationActive
          animationDuration={800}
        />
        <Area
          type="monotone"
          dataKey="failed"
          stroke="var(--destructive)"
          strokeWidth={2}
          fill="url(#probeFailFill)"
          isAnimationActive
          animationDuration={800}
        />
      </AreaChart>
    </ChartContainer>
  )
}
