"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertTriangle, ArrowLeft, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[v0] global error:", error)
  }, [error])

  return (
    <div className="grid min-h-svh place-items-center bg-background p-6 text-foreground">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-7 text-center">
        <div className="mx-auto grid size-12 place-items-center rounded-xl border border-destructive/30 bg-destructive/10">
          <AlertTriangle className="size-5 text-destructive" />
        </div>
        <h2 className="mt-4 font-sans text-xl font-semibold tracking-tight">Something broke</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          A page-level error was caught. Probe is logging the digest to the console.
        </p>
        {error.digest ? (
          <code className="mt-4 inline-block rounded-md border border-border bg-background px-2 py-1 font-mono text-[11px] text-muted-foreground">
            digest: {error.digest}
          </code>
        ) : null}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button variant="outline" asChild className="rounded-full bg-transparent">
            <Link href="/">
              <ArrowLeft className="mr-1.5 size-4" /> Home
            </Link>
          </Button>
          <Button onClick={reset} className="rounded-full">
            <RotateCcw className="mr-1.5 size-4" /> Try again
          </Button>
        </div>
      </div>
    </div>
  )
}
