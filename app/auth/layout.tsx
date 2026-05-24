import type React from "react"
import Link from "next/link"
import { Logo } from "@/components/logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { ArrowLeft } from "lucide-react"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative grid min-h-svh lg:grid-cols-2">
      {/* Top bar — on lg+ it only spans the right (form) column so it doesn't overlap the brand logo */}
      <header className="absolute right-0 top-0 z-20 flex items-center justify-between p-5 md:p-7 left-0 lg:left-1/2">
        <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" />
          <span className="font-mono">cd ..</span>
        </Link>
        <ThemeToggle />
      </header>

      {/* Brand panel — visible on lg+ */}
      <aside className="relative hidden overflow-hidden border-r border-border bg-background lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div aria-hidden className="absolute inset-0 grid-bg opacity-60" />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 top-1/3 size-[480px] rounded-full bg-primary/15 blur-3xl"
        />

        <div className="relative">
          <Logo />
        </div>

        <div className="relative space-y-8">
          {/* Mock console snapshot */}
          <div className="overflow-hidden rounded-xl border border-border bg-card/80 backdrop-blur">
            <div className="flex items-center gap-1.5 border-b border-border px-4 py-2.5">
              <span className="size-2.5 rounded-full bg-muted-foreground/30" />
              <span className="size-2.5 rounded-full bg-muted-foreground/30" />
              <span className="size-2.5 rounded-full bg-muted-foreground/30" />
              <span className="ml-3 font-mono text-xs text-muted-foreground">probe ~ live</span>
            </div>
            <div className="space-y-2.5 p-4 font-mono text-[12.5px] leading-6">
              <Row method="POST" url="/v1/checkout" status="200" detail="schema drift detected" tone="degraded" />
              <Row method="GET" url="/v1/users/me" status="200" detail="all assertions passed" tone="ok" />
              <Row method="POST" url="/v1/payments" status="500" detail="incident opened" tone="fail" />
              <Row method="GET" url="/v1/health" status="200" detail="p95 142ms" tone="ok" />
            </div>
          </div>

          <blockquote className="max-w-md text-pretty text-lg leading-relaxed text-foreground">
            &ldquo;Probe caught a silent contract change in our auth flow that returned <span className="font-mono text-primary">200 OK</span> with the wrong shape. Saved us a P0 in production.&rdquo;
            <footer className="mt-4 flex items-center gap-3 text-sm text-muted-foreground">
              <span className="grid size-8 place-items-center rounded-full border border-border bg-card font-mono text-xs">
                MK
              </span>
              <span>
                Mira K. &middot; Staff Eng @ <span className="font-mono">linear.app</span>
              </span>
            </footer>
          </blockquote>
        </div>
      </aside>

      {/* Form panel */}
      <main className="relative flex items-center justify-center p-6 pt-20 md:p-10 lg:pt-10">
        {/* Subtle background on form side too, for mobile */}
        <div aria-hidden className="absolute inset-0 grid-bg opacity-30 lg:hidden" />
        <div className="relative w-full max-w-sm">{children}</div>
      </main>
    </div>
  )
}

function Row({
  method,
  url,
  status,
  detail,
  tone,
}: {
  method: string
  url: string
  status: string
  detail: string
  tone: "ok" | "degraded" | "fail"
}) {
  const dot =
    tone === "ok"
      ? "bg-primary shadow-[0_0_10px_var(--primary)]"
      : tone === "degraded"
        ? "bg-amber-500"
        : "bg-destructive"
  const statusColor = tone === "ok" ? "text-primary" : tone === "degraded" ? "text-amber-500" : "text-destructive"
  return (
    <div className="flex items-center gap-3">
      <span className={`size-2 rounded-full ${dot}`} aria-hidden />
      <span className="w-12 shrink-0 text-muted-foreground">{method}</span>
      <span className="flex-1 truncate text-foreground">{url}</span>
      <span className={`tabular-nums ${statusColor}`}>{status}</span>
      <span className="hidden w-44 truncate text-muted-foreground xl:inline">{detail}</span>
    </div>
  )
}
