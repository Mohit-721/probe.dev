import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/dashboard/page-header"
import { StatusPill } from "@/components/dashboard/status-pill"
import { Button } from "@/components/ui/button"
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react"
import type { Run, StepResult, AssertionResult } from "@/lib/types"

export const dynamic = "force-dynamic"

type RunWithMonitor = Run & { monitors: { id: string; name: string; slug: string } | null }

export default async function RunDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data } = await supabase
    .from("runs")
    .select("*, monitors(id, name, slug)")
    .eq("id", id)
    .maybeSingle()

  if (!data) notFound()
  const run = data as unknown as RunWithMonitor

  const steps: StepResult[] = run.step_results ?? []

  return (
    <>
      <PageHeader
        breadcrumb={
          <span>
            ~ / <Link href="/dashboard/runs" className="hover:text-foreground">runs</Link> / {run.id.slice(0, 8)}
          </span>
        }
        title={
          <span className="flex items-center gap-3">
            <StatusPill status={run.status} />
            <span className="truncate">{run.monitors?.name ?? "Run"}</span>
          </span>
        }
        description={
          <span className="font-mono text-xs">
            {run.trigger} · started {new Date(run.started_at).toLocaleString()}
          </span>
        }
        actions={
          <Button asChild variant="ghost" size="sm" className="rounded-full">
            <Link href={run.monitors?.id ? `/dashboard/monitors/${run.monitors.id}` : "/dashboard/runs"}>
              <ArrowLeft className="mr-1.5 size-3.5" /> Back to monitor
            </Link>
          </Button>
        }
      />

      <div className="space-y-6 px-4 py-6 md:px-8 md:py-8">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Metric label="Steps" value={String(steps.length)} mono />
          <Metric label="Total" value={run.duration_ms != null ? `${run.duration_ms}ms` : "—"} mono />
          <Metric label="Region" value={run.region ?? "—"} mono />
          <Metric label="Trigger" value={run.trigger} mono />
        </div>

        {run.error_message ? (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-5">
            <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-destructive">Error</div>
            <pre className="whitespace-pre-wrap break-words font-mono text-sm text-destructive">{run.error_message}</pre>
          </div>
        ) : null}

        <section>
          <h3 className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Step trace</h3>
          <div className="space-y-2">
            {steps.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
                No step data captured.
              </div>
            ) : (
              steps.map((step, i) => <StepCard key={i} step={step} index={i} />)
            )}
          </div>
        </section>
      </div>
    </>
  )
}

function StepCard({ step, index }: { step: StepResult; index: number }) {
  const ok = step.status === "success"
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center gap-3 border-b border-border px-5 py-3">
        <div
          className="flex size-7 shrink-0 items-center justify-center rounded-full font-mono text-[10px]"
          style={{
            background: ok
              ? "color-mix(in oklch, var(--primary) 15%, transparent)"
              : "color-mix(in oklch, var(--destructive) 15%, transparent)",
            color: ok ? "var(--primary)" : "var(--destructive)",
          }}
        >
          {String(index + 1).padStart(2, "0")}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{step.step}</div>
          <div className="truncate font-mono text-xs text-muted-foreground">
            {step.status_code != null ? `→ ${step.status_code}` : "no response"}
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="font-mono">{step.duration_ms}ms</span>
          {ok ? <CheckCircle2 className="size-4 text-primary" /> : <XCircle className="size-4 text-destructive" />}
        </div>
      </div>
      {step.assertions?.length ? (
        <ul className="divide-y divide-border bg-muted/20">
          {step.assertions.map((a: AssertionResult, j: number) => (
            <li key={j} className="flex items-center gap-3 px-5 py-2 font-mono text-xs">
              {a.ok ? (
                <CheckCircle2 className="size-3.5 shrink-0 text-primary" />
              ) : (
                <XCircle className="size-3.5 shrink-0 text-destructive" />
              )}
              <span className="truncate">{a.name}</span>
              {a.actual !== undefined ? (
                <span className="ml-auto truncate text-muted-foreground">{String(a.actual)}</span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
      {step.error ? (
        <pre className="whitespace-pre-wrap border-t border-border bg-destructive/5 px-5 py-3 font-mono text-xs text-destructive">
          {step.error}
        </pre>
      ) : null}
    </div>
  )
}

function Metric({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-2 truncate text-lg font-medium ${mono ? "font-mono" : ""}`}>{value}</div>
    </div>
  )
}
