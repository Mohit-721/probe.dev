import type React from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { MobileBottomNav } from "@/components/dashboard/mobile-nav"
import { MobileTopBar } from "@/components/dashboard/mobile-top-bar"
import { CommandPalette } from "@/components/dashboard/command-palette"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")

  return (
    <div className="flex min-h-svh flex-col bg-background lg:flex-row">
      <DashboardSidebar email={user.email ?? null} />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileTopBar />
        <main className="flex-1">{children}</main>
        <MobileBottomNav />
      </div>
      <CommandPalette />
    </div>
  )
}
