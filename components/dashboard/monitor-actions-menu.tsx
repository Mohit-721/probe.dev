"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { MoreVertical, Power, Trash2 } from "lucide-react"
import { deleteMonitor, toggleMonitor } from "@/app/dashboard/monitors/actions"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"

export function MonitorActionsMenu({
  monitorId,
  enabled,
}: {
  monitorId: string
  enabled: boolean
}) {
  const [pending, startTransition] = React.useTransition()

  function handleToggle() {
    startTransition(async () => {
      const res = await toggleMonitor(monitorId, !enabled)
      if (res?.error) toast.error("Failed", { description: res.error })
    })
  }

  function handleDelete() {
    if (!confirm("Delete this monitor and all its runs? This cannot be undone.")) return
    startTransition(async () => {
      const res = await deleteMonitor(monitorId)
      if (res?.error) toast.error("Failed", { description: res.error })
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" disabled={pending} className="rounded-full bg-transparent">
          <MoreVertical className="size-4" />
          <span className="sr-only">Monitor actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44">
        <DropdownMenuItem onClick={handleToggle}>
          <Power className="mr-2 size-4" /> {enabled ? "Pause" : "Resume"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
          <Trash2 className="mr-2 size-4" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
