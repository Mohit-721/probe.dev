import type React from "react"
import { cn } from "@/lib/utils"

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
  className,
}: {
  label: string
  value: React.ReactNode
  hint?: string
  icon?: React.ComponentType<{ className?: string }>
  tone?: "default" | "primary" | "destructive" | "warning"
  className?: string
}) {
  const toneClass =
    tone === "primary"
      ? "text-primary"
      : tone === "destructive"
        ? "text-destructive"
        : tone === "warning"
          ? "text-amber-500"
          : "text-foreground"

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-border bg-card p-5 transition-colors",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span>
        {Icon ? <Icon className={cn("size-4", toneClass)} /> : null}
      </div>
      <div className={cn("mt-3 font-mono text-3xl font-semibold tabular-nums tracking-tight md:text-4xl", toneClass)}>
        {value}
      </div>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  )
}
