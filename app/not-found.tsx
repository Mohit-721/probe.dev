import Link from "next/link"
import { Compass, Home } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="grid min-h-svh place-items-center bg-background p-6 text-foreground">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card p-8 text-center">
        <div aria-hidden className="pointer-events-none absolute inset-0 grid-bg opacity-40" />
        <div className="relative">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">404 / not_found</div>
          <h1 className="mt-3 font-sans text-5xl font-semibold tracking-tight md:text-6xl">
            <span className="text-primary">{"{"}</span>
            <span className="font-mono">probe</span>
            <span className="text-primary">{"}"}</span>
          </h1>
          <p className="mt-3 text-balance text-sm text-muted-foreground">
            We probed every endpoint, none of them returned this page.
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <Button variant="outline" asChild className="rounded-full bg-transparent">
              <Link href="/dashboard">
                <Compass className="mr-1.5 size-4" /> Dashboard
              </Link>
            </Button>
            <Button asChild className="rounded-full">
              <Link href="/">
                <Home className="mr-1.5 size-4" /> Home
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
