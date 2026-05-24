import { cn } from "@/lib/utils"

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative">
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
          className="text-primary"
        >
          <path
            d="M3 12C3 12 6 4 12 4C18 4 21 12 21 12C21 12 18 20 12 20C6 20 3 12 3 12Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="12" r="3" fill="currentColor" />
        </svg>
        <span className="absolute inset-0 -z-10 rounded-full bg-primary/30 blur-md" aria-hidden />
      </div>
      <span className="font-mono text-[15px] font-semibold tracking-tight">probe</span>
      <span className="font-mono text-[15px] font-semibold tracking-tight text-muted-foreground/70">/</span>
      <span className="font-mono text-[13px] text-muted-foreground">v1</span>
    </div>
  )
}
