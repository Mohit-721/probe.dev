"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowUpRight, Search, X } from "lucide-react"
import { StatusPill } from "@/components/dashboard/status-pill"
import { cn } from "@/lib/utils"
import type { Monitor } from "@/lib/types"

type Filter = "all" | "healthy" | "failing" | "paused"

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "healthy", label: "Healthy" },
  { id: "failing", label: "Failing" },
  { id: "paused", label: "Paused" },
]

export function MonitorsListClient({ monitors }: { monitors: Monitor[] }) {
  const [query, setQuery] = React.useState("")
  const [filter, setFilter] = React.useState<Filter>("all")
  const inputRef = React.useRef<HTMLInputElement | null>(null)

  // Focus search with `/`
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    return monitors.filter((m) => {
      if (filter === "healthy" && m.last_status !== "success") return false
      if (filter === "failing" && m.last_status !== "failed") return false
      if (filter === "paused" && m.enabled) return false
      if (!q) return true
      const url = m.config?.steps?.[0]?.url ?? ""
      return (
        m.name.toLowerCase().includes(q) ||
        m.slug.toLowerCase().includes(q) ||
        url.toLowerCase().includes(q)
      )
    })
  }, [monitors, query, filter])

  const counts = React.useMemo(() => {
    return {
      all: monitors.length,
      healthy: monitors.filter((m) => m.last_status === "success").length,
      failing: monitors.filter((m) => m.last_status === "failed").length,
      paused: monitors.filter((m) => !m.enabled).length,
    }
  }, [monitors])

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter monitors by name, slug or URL…"
            className="h-10 w-full rounded-full border border-border bg-card pl-9 pr-9 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-foreground/30"
          />
          {query ? (
            <button
              onClick={() => setQuery("")}
              className="absolute right-2 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="size-3.5" />
            </button>
          ) : (
            <kbd className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground md:inline-block">
              /
            </kbd>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1 rounded-full border border-border bg-card p-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors",
                filter === f.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {f.label}
              <span
                className={cn(
                  "rounded-full px-1.5 text-[10px] tabular-nums",
                  filter === f.id ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground",
                )}
              >
                {counts[f.id]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex items-center justify-center rounded-xl border border-dashed border-border bg-card p-10 text-sm text-muted-foreground">
          No monitors match those filters.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="hidden grid-cols-[1.5fr_1fr_120px_120px_130px_36px] items-center gap-4 border-b border-border bg-muted/40 px-4 py-2.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground md:grid">
            <span>Monitor</span>
            <span>Endpoint</span>
            <span>Status</span>
            <span>Schedule</span>
            <span className="text-right">Last run</span>
            <span />
          </div>

          <ul className="divide-y divide-border">
            {filtered.map((m) => {
              const url = m.config?.steps?.[0]?.url ?? ""
              return (
                <li key={m.id}>
                  <Link
                    href={`/dashboard/monitors/${m.id}`}
                    className="grid grid-cols-1 gap-2 px-4 py-3 transition-colors hover:bg-muted/40 md:grid-cols-[1.5fr_1fr_120px_120px_130px_36px] md:items-center md:gap-4"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-medium">{m.name}</span>
                        {!m.enabled ? (
                          <span className="rounded-md border border-border bg-background px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                            paused
                          </span>
                        ) : null}
                      </div>
                      <div className="truncate font-mono text-[11px] text-muted-foreground">{m.slug}</div>
                    </div>
                    <div className="truncate font-mono text-xs text-muted-foreground">{url}</div>
                    <div>
                      <StatusPill status={m.last_status} />
                    </div>
                    <div className="font-mono text-xs text-muted-foreground">{m.schedule}</div>
                    <div className="text-right font-mono text-xs text-muted-foreground">
                      {m.last_run_at ? new Date(m.last_run_at).toLocaleString() : "—"}
                    </div>
                    <div className="hidden text-muted-foreground md:flex md:justify-end">
                      <ArrowUpRight className="size-4" />
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </>
  )
}
