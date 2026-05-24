"use client"

import { Area, AreaChart, ResponsiveContainer } from "recharts"

export function Sparkline({
  values,
  height = 32,
  color = "var(--primary)",
}: {
  values: number[]
  height?: number
  color?: string
}) {
  if (values.length === 0) {
    return <div className="h-8 w-full rounded bg-muted/40" />
  }
  const data = values.map((v, i) => ({ i, v }))
  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, bottom: 2, left: 0, right: 0 }}>
          <defs>
            <linearGradient id="sparkfill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.5} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.5}
            fill="url(#sparkfill)"
            isAnimationActive
            animationDuration={600}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
