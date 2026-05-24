"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Activity, Boxes, Compass, LifeBuoy, LogOut, Settings, Siren, Sparkles, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import { Logo } from "@/components/logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { CommandPaletteButton } from "@/components/dashboard/command-palette"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

const NAV: Array<{ section: string; items: Array<{ label: string; href: string; icon: React.ComponentType<{ className?: string }> }> }> = [
  {
    section: "Workspace",
    items: [
      { label: "Overview", href: "/dashboard", icon: Compass },
      { label: "Monitors", href: "/dashboard/monitors", icon: Boxes },
      { label: "Runs", href: "/dashboard/runs", icon: Activity },
      { label: "Incidents", href: "/dashboard/incidents", icon: Siren },
      { label: "AI Insights", href: "/dashboard/insights", icon: Sparkles },
    ],
  },
  {
    section: "Settings",
    items: [
      { label: "Workspace", href: "/dashboard/settings", icon: Settings },
    ],
  },
]

export function DashboardSidebar({ email }: { email: string | null }) {
  const pathname = usePathname()
  const router = useRouter()

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  return (
    <aside className="sticky top-0 hidden h-svh w-64 shrink-0 flex-col border-r border-border bg-sidebar lg:flex">
      <div className="flex h-14 items-center justify-between gap-2 border-b border-border px-4">
        <Link href="/" className="flex items-center">
          <Logo />
        </Link>
        <CommandPaletteButton />
      </div>

      <Link
        href="/dashboard/monitors/new"
        className="mx-3 mt-3 flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium transition-colors hover:bg-accent"
      >
        <span className="flex items-center gap-2">
          <Zap className="size-4 text-primary" /> New monitor
        </span>
        <kbd className="font-mono text-[10px] text-muted-foreground">N</kbd>
      </Link>

      <nav className="mt-4 flex-1 space-y-6 px-3 pb-4">
        {NAV.map((group) => (
          <div key={group.section}>
            <div className="px-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              {group.section}
            </div>
            <ul className="mt-2 space-y-0.5">
              {group.items.map((item) => {
                const active =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href))
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors",
                        active
                          ? "bg-accent text-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground",
                      )}
                    >
                      <item.icon className={cn("size-4", active && "text-primary")} />
                      {item.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-border p-3">
        <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card p-2">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="grid size-8 shrink-0 place-items-center rounded-md bg-primary/15 font-mono text-xs text-primary">
              {(email?.[0] ?? "?").toUpperCase()}
            </span>
            <span className="truncate font-mono text-xs text-muted-foreground">{email ?? "guest"}</span>
          </div>
          <ThemeToggle />
        </div>

        <div className="mt-2 flex items-center gap-1">
          <Link
            href="/#docs"
            className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-border bg-card px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <LifeBuoy className="size-3.5" /> Help
          </Link>
          <button
            onClick={signOut}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-border bg-card px-2 py-1.5 text-xs text-muted-foreground hover:text-destructive"
          >
            <LogOut className="size-3.5" /> Sign out
          </button>
        </div>
      </div>
    </aside>
  )
}
