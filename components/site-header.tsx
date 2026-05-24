"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { ArrowRight, Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"

const NAV = [
  { label: "Product", href: "#product" },
  { label: "Workflows", href: "#workflows" },
  { label: "Code", href: "#code" },
  { label: "Compare", href: "#compare" },
  { label: "Docs", href: "#docs" },
]

export function SiteHeader() {
  const [scrolled, setScrolled] = React.useState(false)
  const [open, setOpen] = React.useState(false)
  const [activeId, setActiveId] = React.useState<string | null>(null)

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // Active-section tracking via IntersectionObserver
  React.useEffect(() => {
    const ids = NAV.map((n) => n.href.replace("#", "")).filter(Boolean)
    const els = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el))
    if (els.length === 0) return

    // Use a band centered ~30% from the top so the active state matches what you're reading.
    const observer = new IntersectionObserver(
      (entries) => {
        // Find the entry with the largest intersection ratio that's currently visible.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        if (visible[0]?.target.id) {
          setActiveId(visible[0].target.id)
        }
      },
      {
        rootMargin: "-30% 0px -55% 0px",
        threshold: [0, 0.25, 0.5, 0.75, 1],
      },
    )
    els.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  // Close mobile menu on Escape
  React.useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3">
      <div
        className={`mx-auto flex max-w-6xl items-center justify-between gap-4 rounded-full border px-3 py-2 transition-all duration-300 ${
          scrolled
            ? "border-border/70 bg-background/70 backdrop-blur-xl shadow-[0_1px_0_0_color-mix(in_oklch,var(--foreground)_10%,transparent)_inset]"
            : "border-transparent bg-transparent"
        }`}
      >
        <Link href="/" className="flex items-center gap-2 pl-2">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {NAV.map((item) => {
            const id = item.href.replace("#", "")
            const isActive = activeId === id
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "true" : undefined}
                className={cn(
                  "relative rounded-full px-3 py-1.5 text-sm transition-colors",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {item.label}
                <span
                  aria-hidden
                  className={cn(
                    "pointer-events-none absolute inset-x-3 -bottom-0.5 h-px transition-all duration-300",
                    isActive
                      ? "bg-primary opacity-100 shadow-[0_0_8px_var(--primary)]"
                      : "bg-transparent opacity-0",
                  )}
                />
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button asChild size="sm" variant="ghost" className="hidden rounded-full md:inline-flex">
            <Link href="/auth/login">Sign in</Link>
          </Button>
          <Button asChild size="sm" className="hidden rounded-full md:inline-flex">
            <Link href="/auth/sign-up">
              Start free <ArrowRight className="ml-1 size-3.5" />
            </Link>
          </Button>
          <button
            aria-label="Toggle menu"
            className="md:hidden rounded-full border border-border/60 p-2"
            onClick={() => setOpen((s) => !s)}
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden mx-auto mt-2 max-w-6xl rounded-2xl border border-border/70 bg-background/90 p-3 backdrop-blur-xl">
          <nav className="flex flex-col gap-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Button asChild variant="outline" className="rounded-full bg-transparent">
                <Link href="/auth/login">Sign in</Link>
              </Button>
              <Button asChild className="rounded-full">
                <Link href="/auth/sign-up">Start free</Link>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
