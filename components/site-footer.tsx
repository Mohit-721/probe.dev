import Link from "next/link"
import { Logo } from "@/components/logo"

const COLS = [
  {
    title: "Product",
    links: ["Monitors", "Flows", "Schema validation", "Security scans", "Status pages", "Pricing"],
  },
  {
    title: "Developers",
    links: ["Docs", "CLI", "GitHub Action", "API reference", "Changelog", "System status"],
  },
  {
    title: "Company",
    links: ["About", "Customers", "Careers", "Security", "Legal", "Contact"],
  },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-muted/20">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-10 md:grid-cols-[1.5fr_repeat(3,minmax(0,1fr))]">
          <div>
            <Logo />
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">
              The intelligent API testing & security engine. Built for engineers who refuse to ship
              blind.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="relative flex size-1.5">
                <span className="absolute inset-0 animate-ping rounded-full bg-primary opacity-60" />
                <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
              </span>
              All systems operational
            </div>
          </div>

          {COLS.map((c) => (
            <div key={c.title}>
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {c.title}
              </div>
              <ul className="mt-4 space-y-2.5">
                {c.links.map((l) => (
                  <li key={l}>
                    <Link
                      href="#"
                      className="text-sm text-foreground/80 hover:text-primary transition-colors"
                    >
                      {l}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-border/60 pt-8 md:flex-row md:items-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Probe Labs, Inc. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Link href="#" className="hover:text-foreground">
              Privacy
            </Link>
            <Link href="#" className="hover:text-foreground">
              Terms
            </Link>
            <Link href="#" className="hover:text-foreground">
              SOC 2
            </Link>
            <Link href="#" className="hover:text-foreground">
              GDPR
            </Link>
          </div>
        </div>

        {/* Big wordmark */}
        <div
          aria-hidden
          className="mt-10 select-none text-center font-sans text-[20vw] font-semibold leading-none tracking-tighter text-foreground/[0.04]"
        >
          probe.dev
        </div>
      </div>
    </footer>
  )
}
