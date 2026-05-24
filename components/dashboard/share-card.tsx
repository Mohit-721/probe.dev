"use client"

import * as React from "react"
import { Globe, Copy, ExternalLink, Lock, Loader2 } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { setMonitorPublic } from "@/app/dashboard/monitors/actions"
import { toast } from "sonner"

export function ShareCard({
  monitorId,
  initialToken,
}: {
  monitorId: string
  initialToken: string | null
}) {
  const [token, setToken] = React.useState<string | null>(initialToken)
  const [pending, startTransition] = React.useTransition()
  const [origin, setOrigin] = React.useState("")

  React.useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  function onToggle(checked: boolean) {
    startTransition(async () => {
      const res = await setMonitorPublic(monitorId, checked)
      if (res?.error) {
        toast.error("Failed to update sharing", { description: res.error })
        return
      }
      setToken(res?.token ?? null)
      toast.success(checked ? "Status page is live" : "Status page disabled")
    })
  }

  const url = token ? `${origin}/status/${token}` : ""

  function copyUrl() {
    if (!url) return
    navigator.clipboard.writeText(url)
    toast.success("Link copied")
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <div className="flex items-center gap-2">
          {token ? (
            <Globe className="size-4 text-primary" />
          ) : (
            <Lock className="size-4 text-muted-foreground" />
          )}
          <h2 className="text-sm font-medium">Public status page</h2>
        </div>
        <div className="flex items-center gap-2">
          {pending ? <Loader2 className="size-3.5 animate-spin text-muted-foreground" /> : null}
          <Switch checked={!!token} onCheckedChange={onToggle} disabled={pending} aria-label="Share publicly" />
        </div>
      </div>
      <div className="space-y-2 p-5">
        <p className="text-xs text-muted-foreground">
          {token
            ? "Anyone with the link sees a live, themed status board for this monitor — no auth required."
            : "Toggle on to publish a beautiful, public status page for this monitor."}
        </p>
        {token ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-2.5 py-2 font-mono text-xs">
              <span className="truncate text-muted-foreground" title={url}>
                {url}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="outline" className="rounded-full bg-transparent" onClick={copyUrl}>
                <Copy className="mr-1.5 size-3.5" /> Copy link
              </Button>
              <Button size="sm" asChild className="rounded-full">
                <a href={url} target="_blank" rel="noreferrer">
                  Open <ExternalLink className="ml-1.5 size-3.5" />
                </a>
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
