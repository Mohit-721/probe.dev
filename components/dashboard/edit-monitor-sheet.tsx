"use client"

import * as React from "react"
import { updateMonitor } from "@/app/dashboard/monitors/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Spinner } from "@/components/ui/spinner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { toast } from "sonner"
import type { Monitor } from "@/lib/types"

export function EditMonitorSheet({
  monitor,
  open,
  onOpenChange,
}: {
  monitor: Monitor
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const step = monitor.config?.steps?.[0]
  const existingHeaderName = step?.headers ? Object.keys(step.headers)[0] ?? "Authorization" : "Authorization"
  const existingHeaderValue = step?.headers ? Object.values(step.headers)[0] ?? "" : ""
  const existingStatus = step?.assertions?.find((a) => a.kind === "status")
  const existingDuration = step?.assertions?.find((a) => a.kind === "duration_ms")

  const [method, setMethod] = React.useState(step?.method ?? "GET")
  const [schedule, setSchedule] = React.useState(monitor.schedule ?? "*/5 * * * *")
  const [error, setError] = React.useState<string | null>(null)
  const [pending, startTransition] = React.useTransition()

  const isBodyAllowed = method !== "GET" && method !== "HEAD"

  async function action(formData: FormData) {
    setError(null)
    formData.set("method", method)
    formData.set("schedule", schedule)
    startTransition(async () => {
      const res = await updateMonitor(monitor.id, formData)
      if (res?.error) {
        setError(res.error)
      } else {
        toast.success("Monitor updated", { description: "Changes saved and applied." })
        window.dispatchEvent(new CustomEvent("probe:run-complete")) // trigger live refresh
        onOpenChange(false)
      }
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Edit monitor</SheetTitle>
          <SheetDescription>
            Update the configuration for <span className="font-medium text-foreground">{monitor.name}</span>.
            Changes take effect on the next run.
          </SheetDescription>
        </SheetHeader>

        <form action={action} className="mt-6 space-y-6">
          {/* Identity */}
          <fieldset className="space-y-4 rounded-xl border border-border p-4">
            <legend className="px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">Identity</legend>
            <Field id="edit-name" label="Name" required>
              <Input id="edit-name" name="name" required defaultValue={monitor.name} className="h-10" />
            </Field>
            <Field id="edit-description" label="Description">
              <Textarea
                id="edit-description"
                name="description"
                rows={2}
                defaultValue={monitor.description ?? ""}
              />
            </Field>
          </fieldset>

          {/* Request */}
          <fieldset className="space-y-4 rounded-xl border border-border p-4">
            <legend className="px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">Request</legend>
            <div className="grid grid-cols-[100px_1fr] gap-3">
              <Field id="edit-method" label="Method">
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger className="h-10 font-mono">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"].map((m) => (
                      <SelectItem key={m} value={m} className="font-mono">{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field id="edit-url" label="URL" required>
                <Input
                  id="edit-url"
                  name="url"
                  required
                  type="url"
                  defaultValue={step?.url ?? ""}
                  className="h-10 font-mono"
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field id="edit-header-name" label="Header name">
                <Input
                  id="edit-header-name"
                  name="header_name"
                  defaultValue={existingHeaderName}
                  className="h-10 font-mono"
                />
              </Field>
              <Field id="edit-header-value" label="Header value">
                <Input
                  id="edit-header-value"
                  name="header_value"
                  defaultValue={existingHeaderValue}
                  className="h-10 font-mono"
                  placeholder="Bearer your-key"
                />
              </Field>
            </div>

            {isBodyAllowed && (
              <Field id="edit-body" label="Request body">
                <Textarea
                  id="edit-body"
                  name="body"
                  rows={3}
                  defaultValue={step?.body ?? ""}
                  className="font-mono text-xs"
                  placeholder='{"ping":"pong"}'
                />
              </Field>
            )}
          </fieldset>

          {/* Assertions */}
          <fieldset className="space-y-4 rounded-xl border border-border p-4">
            <legend className="px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">Assertions</legend>
            <div className="grid grid-cols-2 gap-3">
              <Field id="edit-status" label="Expected status">
                <Input
                  id="edit-status"
                  name="expected_status"
                  type="number"
                  min={100}
                  max={599}
                  defaultValue={existingStatus?.kind === "status" ? String(existingStatus.value) : "200"}
                  className="h-10 font-mono"
                />
              </Field>
              <Field id="edit-duration" label="Max duration (ms)">
                <Input
                  id="edit-duration"
                  name="max_duration_ms"
                  type="number"
                  min={100}
                  step={100}
                  defaultValue={existingDuration?.kind === "duration_ms" ? String(existingDuration.value) : "5000"}
                  className="h-10 font-mono"
                />
              </Field>
            </div>
          </fieldset>

          {/* Schedule */}
          <fieldset className="space-y-3 rounded-xl border border-border p-4">
            <legend className="px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">Schedule</legend>
            <Select value={schedule} onValueChange={setSchedule}>
              <SelectTrigger className="h-10 font-mono">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="* * * * *" className="font-mono">every minute</SelectItem>
                <SelectItem value="*/5 * * * *" className="font-mono">every 5 minutes</SelectItem>
                <SelectItem value="*/15 * * * *" className="font-mono">every 15 minutes</SelectItem>
                <SelectItem value="0 * * * *" className="font-mono">every hour</SelectItem>
                <SelectItem value="0 0 * * *" className="font-mono">daily at midnight</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Current: <code className="font-mono">{monitor.schedule}</code></p>
          </fieldset>

          {error && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </div>
          )}

          <div className="flex gap-3 pb-2">
            <Button type="submit" disabled={pending} className="flex-1 rounded-full">
              {pending ? <><Spinner className="size-4" /> Saving…</> : "Save changes"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-full"
            >
              Cancel
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}

function Field({
  id,
  label,
  required,
  children,
}: {
  id: string
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}{required && <span className="text-destructive"> *</span>}
      </Label>
      {children}
    </div>
  )
}
