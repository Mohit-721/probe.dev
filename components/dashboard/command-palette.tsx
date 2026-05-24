"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Activity,
  Boxes,
  Compass,
  Github,
  LifeBuoy,
  LogOut,
  Moon,
  Plus,
  Search,
  Settings,
  Siren,
  Sun,
} from "lucide-react"
import { useTheme } from "next-themes"
import { createClient } from "@/lib/supabase/client"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"

type Monitor = { id: string; name: string; slug: string; last_status: string | null }

export function CommandPalette() {
  const [open, setOpen] = React.useState(false)
  const [monitors, setMonitors] = React.useState<Monitor[]>([])
  const router = useRouter()
  const { theme, setTheme } = useTheme()

  // Cmd/Ctrl+K to open
  React.useEffect(() => {
    function down(e: KeyboardEvent) {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  // Load user's monitors when palette opens (deferred to first open for speed)
  React.useEffect(() => {
    if (!open || monitors.length > 0) return
    const supabase = createClient()
    supabase
      .from("monitors")
      .select("id, name, slug, last_status")
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (data) setMonitors(data as Monitor[])
      })
  }, [open, monitors.length])

  function go(href: string) {
    setOpen(false)
    router.push(href)
  }

  async function signOut() {
    setOpen(false)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search monitors, jump to a page, or run a command…" />
      <CommandList>
        <CommandEmpty>
          <div className="flex flex-col items-center gap-2 py-6 text-sm text-muted-foreground">
            <Search className="size-4" />
            Nothing matched. Try “new monitor” or “runs”.
          </div>
        </CommandEmpty>

        <CommandGroup heading="Quick actions">
          <CommandItem onSelect={() => go("/dashboard/monitors/new")}>
            <Plus className="text-primary" />
            New monitor
            <CommandShortcut>N</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => go("/dashboard/insights")}>
            <Activity className="text-primary" />
            Run AI Insights on recent failures
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Navigate">
          <CommandItem onSelect={() => go("/dashboard")}>
            <Compass />
            Overview
          </CommandItem>
          <CommandItem onSelect={() => go("/dashboard/monitors")}>
            <Boxes />
            Monitors
          </CommandItem>
          <CommandItem onSelect={() => go("/dashboard/runs")}>
            <Activity />
            Runs
          </CommandItem>
          <CommandItem onSelect={() => go("/dashboard/incidents")}>
            <Siren />
            Incidents
          </CommandItem>
          <CommandItem onSelect={() => go("/dashboard/settings")}>
            <Settings />
            Workspace settings
          </CommandItem>
        </CommandGroup>

        {monitors.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Your monitors">
              {monitors.map((m) => (
                <CommandItem
                  key={m.id}
                  value={`${m.name} ${m.slug}`}
                  onSelect={() => go(`/dashboard/monitors/${m.id}`)}
                >
                  <span
                    className={
                      m.last_status === "success"
                        ? "size-1.5 rounded-full bg-primary shadow-[0_0_6px_var(--primary)]"
                        : m.last_status === "failed"
                          ? "size-1.5 rounded-full bg-destructive"
                          : "size-1.5 rounded-full bg-muted-foreground/50"
                    }
                  />
                  <span className="truncate">{m.name}</span>
                  <span className="ml-auto truncate font-mono text-[11px] text-muted-foreground">{m.slug}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        <CommandSeparator />

        <CommandGroup heading="Preferences">
          <CommandItem onSelect={() => setTheme(theme === "dark" ? "light" : "dark")}>
            {theme === "dark" ? <Sun /> : <Moon />}
            Toggle theme
          </CommandItem>
          <CommandItem onSelect={() => go("/")}>
            <LifeBuoy />
            Visit landing page
          </CommandItem>
          <CommandItem onSelect={() => window.open("https://github.com", "_blank")}>
            <Github />
            Open documentation
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Account">
          <CommandItem onSelect={signOut}>
            <LogOut className="text-destructive" />
            <span className="text-destructive">Sign out</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}

export function CommandPaletteButton() {
  return (
    <button
      onClick={() => {
        const ev = new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true })
        document.dispatchEvent(ev)
      }}
      className="hidden h-8 items-center gap-2 rounded-lg border border-border bg-background px-2.5 font-mono text-[11px] text-muted-foreground transition-colors hover:bg-accent md:inline-flex"
    >
      <Search className="size-3.5" />
      Search…
      <span className="ml-2 inline-flex items-center gap-0.5 rounded border border-border bg-card px-1 py-0.5 text-[10px]">
        ⌘K
      </span>
    </button>
  )
}
