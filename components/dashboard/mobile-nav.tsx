"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Activity, Boxes, Compass, Siren, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

const ITEMS = [
  { label: "Home", href: "/dashboard", icon: Compass },
  { label: "Monitors", href: "/dashboard/monitors", icon: Boxes },
  { label: "Runs", href: "/dashboard/runs", icon: Activity },
  { label: "Incidents", href: "/dashboard/incidents", icon: Siren },
  { label: "AI", href: "/dashboard/insights", icon: Sparkles },
]

export function MobileBottomNav() {
  const pathname = usePathname()
  return (
    <nav className="sticky bottom-0 z-40 grid grid-cols-5 border-t border-border bg-background/90 backdrop-blur lg:hidden">
      {ITEMS.map((item) => {
        const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center gap-1 py-3 text-[10px] uppercase tracking-wider",
              active ? "text-primary" : "text-muted-foreground",
            )}
          >
            <item.icon className="size-5" />
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
