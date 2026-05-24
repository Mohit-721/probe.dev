"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

export function SignOutButton() {
  const router = useRouter()
  const [pending, startTransition] = React.useTransition()

  function onClick() {
    startTransition(async () => {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push("/")
      router.refresh()
    })
  }

  return (
    <Button onClick={onClick} disabled={pending} variant="outline" className="rounded-full bg-transparent">
      <LogOut className="mr-2 size-3.5" />
      {pending ? "Signing out..." : "Sign out"}
    </Button>
  )
}
