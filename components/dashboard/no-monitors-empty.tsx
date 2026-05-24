import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus, Zap } from "lucide-react"

export function NoMonitorsEmpty() {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-card p-10 text-center">
      <div aria-hidden className="pointer-events-none absolute inset-0 grid-bg opacity-30" />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 size-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl"
      />
      <div className="relative">
        <div className="mx-auto grid size-12 place-items-center rounded-2xl border border-border bg-background">
          <Zap className="size-5 text-primary" />
        </div>
        <h3 className="mt-5 text-xl font-semibold tracking-tight">No monitors yet</h3>
        <p className="mx-auto mt-2 max-w-sm text-pretty text-sm text-muted-foreground">
          Create your first monitor to start probing your APIs. Single endpoint or a multi-step flow — both take less
          than a minute.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <Button asChild className="rounded-full">
            <Link href="/dashboard/monitors/new">
              <Plus className="mr-1.5 size-4" /> New monitor
            </Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full bg-transparent">
            <Link href="/#code">View example yaml</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
