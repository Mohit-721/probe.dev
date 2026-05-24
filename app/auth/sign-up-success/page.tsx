import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Mail } from "lucide-react"

export default function SignUpSuccessPage() {
  return (
    <div className="flex flex-col gap-6 text-center">
      <div className="mx-auto grid size-14 place-items-center rounded-2xl border border-border bg-card">
        <Mail className="size-6 text-primary" />
      </div>
      <div className="space-y-2">
        <h1 className="text-balance text-2xl font-semibold tracking-tight md:text-3xl">Check your inbox</h1>
        <p className="text-pretty text-sm text-muted-foreground">
          We just sent you a confirmation link. Click it to activate your account and start probing.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-4 text-left font-mono text-xs text-muted-foreground">
        <div className="flex items-center justify-between">
          <span className="text-foreground">verification</span>
          <span className="text-primary">pending</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full w-1/3 animate-pulse bg-primary" />
        </div>
        <p className="mt-3 text-[11px] leading-5">
          Didn&apos;t receive it? Check spam, or wait 60s and try again.
        </p>
      </div>

      <Button asChild variant="outline" className="rounded-full bg-transparent">
        <Link href="/auth/login">Back to sign in</Link>
      </Button>
    </div>
  )
}
