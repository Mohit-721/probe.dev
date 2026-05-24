"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Play } from "lucide-react"
import { runMonitorNow } from "@/app/dashboard/monitors/[id]/actions"
import { toast } from "sonner"

export function RunNowButton({ monitorId }: { monitorId: string }) {
  const [pending, startTransition] = React.useTransition()

  function onClick() {
    startTransition(async () => {
      const res = await runMonitorNow(monitorId)
      if (res?.error) {
        toast.error("Run failed", { description: res.error })
      } else if (res?.status === "success") {
        toast.success("Probe successful", { description: "All assertions passed." })
      } else {
        toast.error("Probe failed", { description: "One or more assertions failed." })
      }
      // Signal live-polling components to refresh immediately
      window.dispatchEvent(new CustomEvent("probe:run-complete"))
    })
  }

  return (
    <Button onClick={onClick} disabled={pending} className="rounded-full">
      {pending ? (
        <>
          <Spinner className="size-4" /> Running
        </>
      ) : (
        <>
          <Play className="mr-1.5 size-4" /> Run now
        </>
      )}
    </Button>
  )
}
