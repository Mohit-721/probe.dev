import { cn } from "@/lib/utils"

// Renders a compact heat-strip of recent runs (left = oldest, right = newest)
export function ActivityStrip({
  runs,
  emptyHint = "No runs yet",
  cells = 60,
}: {
  runs: Array<{ status: string }>
  emptyHint?: string
  cells?: number
}) {
  if (!runs.length) {
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: cells }).map((_, i) => (
          <span key={i} className="h-5 w-1 rounded-sm bg-muted" />
        ))}
        <span className="ml-2 text-xs text-muted-foreground">{emptyHint}</span>
      </div>
    )
  }
  // Pad start with neutral cells if fewer than `cells` runs
  const padding = Math.max(0, cells - runs.length)
  const items = [
    ...Array.from({ length: padding }).map(() => ({ status: "empty" })),
    ...runs.slice(-cells),
  ]
  return (
    <div className="flex items-center gap-1">
      {items.map((r, i) => (
        <span
          key={i}
          aria-hidden
          className={cn(
            "h-5 w-1 rounded-sm transition-colors",
            r.status === "success" && "bg-primary/80",
            r.status === "failed" && "bg-destructive",
            r.status === "degraded" && "bg-amber-500",
            r.status === "running" && "bg-primary animate-pulse",
            (r.status === "empty" || r.status === "pending") && "bg-muted",
          )}
        />
      ))}
    </div>
  )
}
