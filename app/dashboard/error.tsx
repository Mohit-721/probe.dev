"use client"

import { useEffect } from "react"
import { AlertTriangle, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[v0] dashboard error:", error)
  }, [error])

  const isMissingTable =
    error.message?.toLowerCase().includes("relation") ||
    error.message?.toLowerCase().includes("does not exist") ||
    error.message?.toLowerCase().includes("column") ||
    error.message?.toLowerCase().includes("schema")

  return (
    <div className="flex min-h-[calc(100svh-3.5rem)] flex-col items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-7 text-center">
        <div className="mx-auto grid size-12 place-items-center rounded-xl border border-destructive/30 bg-destructive/10">
          <AlertTriangle className="size-5 text-destructive" />
        </div>
        <h2 className="mt-4 text-balance font-sans text-xl font-semibold tracking-tight">
          {isMissingTable ? "Database not initialized yet" : "Something went off the rails"}
        </h2>
        <p className="mt-2 text-balance text-sm text-muted-foreground">
          {isMissingTable
            ? "It looks like the Probe schema migrations haven't been run yet. Run the SQL scripts in /scripts to bootstrap your tables."
            : "An error was thrown while rendering this page. Try again, and if it persists, contact support."}
        </p>
        {error.digest ? (
          <code className="mt-4 inline-block rounded-md border border-border bg-background px-2 py-1 font-mono text-[11px] text-muted-foreground">
            digest: {error.digest}
          </code>
        ) : null}
        <div className="mt-6 flex justify-center">
          <Button onClick={reset} className="rounded-full">
            <RotateCcw className="mr-1.5 size-4" /> Try again
          </Button>
        </div>
      </div>
    </div>
  )
}
