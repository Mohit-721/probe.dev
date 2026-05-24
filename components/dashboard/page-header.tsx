import type React from "react"
import { cn } from "@/lib/utils"

export function PageHeader({
  title,
  description,
  actions,
  breadcrumb,
  className,
}: {
  title: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  breadcrumb?: React.ReactNode
  className?: string
}) {
  return (
    <header
      className={cn("border-b border-border bg-background/60 px-4 py-6 backdrop-blur md:px-8 md:py-8", className)}
    >
      {breadcrumb ? <div className="mb-3 font-mono text-xs text-muted-foreground">{breadcrumb}</div> : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <h1 className="text-balance text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
          {description ? (
            <p className="max-w-2xl text-pretty text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  )
}
