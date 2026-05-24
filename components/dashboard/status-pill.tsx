import { cn } from "@/lib/utils"

type StatusKey = "success" | "failed" | "degraded" | "pending" | "running"

const STYLES: Record<StatusKey, { dot: string; text: string; label: string }> = {
  success: {
    dot: "bg-primary shadow-[0_0_8px_var(--primary)]",
    text: "text-primary",
    label: "healthy",
  },
  failed: { dot: "bg-destructive", text: "text-destructive", label: "failing" },
  degraded: { dot: "bg-amber-500", text: "text-amber-500", label: "degraded" },
  pending: { dot: "bg-muted-foreground/50", text: "text-muted-foreground", label: "pending" },
  running: {
    dot: "bg-primary animate-pulse",
    text: "text-primary",
    label: "running",
  },
}

function resolve(status: string | null | undefined): StatusKey {
  if (!status) return "pending"
  if (status in STYLES) return status as StatusKey
  return "pending"
}

export function StatusPill({
  status,
  className,
  withDot = true,
  size = "sm",
}: {
  status: string | null | undefined
  className?: string
  withDot?: boolean
  size?: "xs" | "sm"
}) {
  const cfg = STYLES[resolve(status)]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border bg-card font-mono uppercase tracking-wider",
        size === "xs" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-0.5 text-[11px]",
        cfg.text,
        className,
      )}
    >
      {withDot && <span className={cn("size-1.5 rounded-full", cfg.dot)} aria-hidden />}
      {cfg.label}
    </span>
  )
}
