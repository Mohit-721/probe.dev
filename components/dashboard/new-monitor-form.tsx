"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Spinner } from "@/components/ui/spinner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowRight } from "lucide-react"
import { createMonitor } from "@/app/dashboard/monitors/actions"

export function NewMonitorForm() {
  const [error, setError] = React.useState<string | null>(null)
  const [pending, startTransition] = React.useTransition()
  const [method, setMethod] = React.useState("GET")
  const [schedule, setSchedule] = React.useState("*/5 * * * *")

  async function action(formData: FormData) {
    setError(null)
    formData.set("method", method)
    formData.set("schedule", schedule)
    startTransition(async () => {
      const res = await createMonitor(formData)
      if (res?.error) setError(res.error)
    })
  }

  const isBodyAllowed = method !== "GET" && method !== "HEAD"

  return (
    <form action={action} className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
      {/* Main fields */}
      <div className="space-y-6">
        <Section title="Identity" hint="How this monitor appears in your dashboard.">
          <Field id="name" label="Name" required>
            <Input id="name" name="name" required placeholder="Production checkout" className="h-11" />
          </Field>
          <Field id="description" label="Description" hint="Optional. Explain what this probe protects.">
            <Textarea
              id="description"
              name="description"
              rows={2}
              placeholder="End-to-end payment flow against /v1/checkout"
            />
          </Field>
        </Section>

        <Section title="Request" hint="The HTTP request Probe will execute on every run.">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[120px_1fr]">
            <div className="space-y-1.5">
              <Label className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Method</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger className="h-11 font-mono">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"].map((m) => (
                    <SelectItem key={m} value={m} className="font-mono">
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Field id="url" label="URL" required>
              <Input
                id="url"
                name="url"
                required
                type="url"
                placeholder="https://api.example.com/v1/health"
                className="h-11 font-mono"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Field id="header_name" label="Header name" hint="Optional auth or custom header.">
              <Input id="header_name" name="header_name" placeholder="Authorization" className="h-11 font-mono" />
            </Field>
            <Field id="header_value" label="Header value">
              <Input id="header_value" name="header_value" placeholder="Bearer ..." className="h-11 font-mono" />
            </Field>
          </div>

          {isBodyAllowed && (
            <Field id="body" label="Request body" hint="JSON or raw text. Sent as-is.">
              <Textarea id="body" name="body" rows={4} placeholder='{"ping":"pong"}' className="font-mono text-xs" />
            </Field>
          )}
        </Section>

        <Section title="Assertions" hint="Probe fails the run if any of these are violated.">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Field id="expected_status" label="Expected status code">
              <Input
                id="expected_status"
                name="expected_status"
                type="number"
                defaultValue={200}
                min={100}
                max={599}
                className="h-11 font-mono"
              />
            </Field>
            <Field id="max_duration_ms" label="Max duration (ms)">
              <Input
                id="max_duration_ms"
                name="max_duration_ms"
                type="number"
                defaultValue={5000}
                min={100}
                step={100}
                className="h-11 font-mono"
              />
            </Field>
          </div>
        </Section>
      </div>

      {/* Sidebar */}
      <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
        <Section title="Schedule" hint="When to run this monitor.">
          <Select value={schedule} onValueChange={setSchedule}>
            <SelectTrigger className="h-11 font-mono">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="* * * * *" className="font-mono">
                every minute
              </SelectItem>
              <SelectItem value="*/5 * * * *" className="font-mono">
                every 5 minutes
              </SelectItem>
              <SelectItem value="*/15 * * * *" className="font-mono">
                every 15 minutes
              </SelectItem>
              <SelectItem value="0 * * * *" className="font-mono">
                every hour
              </SelectItem>
              <SelectItem value="0 0 * * *" className="font-mono">
                daily at midnight
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">Cron expression. We translate to your local timezone.</p>
        </Section>

        <Section title="Preview">
          <pre className="overflow-x-auto rounded-md border border-border bg-background/60 p-3 font-mono text-[11px] leading-5">
            <code>
              <span className="text-muted-foreground"># Generated yaml</span>
              {"\n"}
              <span className="text-primary">monitor</span>: production-checkout
              {"\n"}
              <span className="text-primary">schedule</span>: <span>{`"${schedule}"`}</span>
              {"\n"}
              <span className="text-primary">step</span>:
              {"\n"}
              {"  "}
              <span className="text-primary">method</span>: {method}
              {"\n"}
              {"  "}
              <span className="text-primary">url</span>: ...
              {"\n"}
              {"  "}
              <span className="text-primary">expect</span>:
              {"\n"}
              {"    "}status: 200
              {"\n"}
              {"    "}duration_ms_lt: 5000
            </code>
          </pre>
        </Section>

        {error ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </div>
        ) : null}

        <Button type="submit" disabled={pending} className="h-11 w-full rounded-full">
          {pending ? (
            <>
              <Spinner className="size-4" /> Creating
            </>
          ) : (
            <>
              Create monitor <ArrowRight className="ml-1 size-4" />
            </>
          )}
        </Button>
        <p className="text-center text-[11px] text-muted-foreground">
          We&apos;ll run the first probe immediately after creation.
        </p>
      </aside>
    </form>
  )
}

function Section({
  title,
  hint,
  children,
}: {
  title: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-4 rounded-xl border border-border bg-card p-5">
      <div>
        <h2 className="font-medium">{title}</h2>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  )
}

function Field({
  id,
  label,
  hint,
  required,
  children,
}: {
  id: string
  label: string
  hint?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  )
}
