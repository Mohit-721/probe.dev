"use client"

import * as React from "react"
import Link from "next/link"
import { Logo } from "@/components/logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { CommandPaletteButton } from "@/components/dashboard/command-palette"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { LogOut, Plus } from "lucide-react"

export function MobileTopBar() {
  const router = useRouter()
  const [scrolled, setScrolled] = React.useState(false)

  React.useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8)
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  return (
    <header
      className={`sticky top-0 z-30 flex h-14 items-center justify-between gap-2 border-b px-4 backdrop-blur transition-colors lg:hidden ${
        scrolled ? "border-border bg-background/85" : "border-transparent bg-background/60"
      }`}
    >
      <Link href="/dashboard" className="flex items-center" aria-label="Probe dashboard">
        <Logo />
      </Link>

      <div className="flex items-center gap-1">
        <CommandPaletteButton />
        <Link
          href="/dashboard/monitors/new"
          className="grid size-9 place-items-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105"
          aria-label="New monitor"
        >
          <Plus className="size-4" />
        </Link>
        <ThemeToggle />
        <button
          onClick={signOut}
          className="grid size-9 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Sign out"
        >
          <LogOut className="size-4" />
        </button>
      </div>
    </header>
  )
}
