import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams

  return (
    <div className="flex flex-col gap-6 text-center">
      <div className="mx-auto grid size-14 place-items-center rounded-2xl border border-destructive/40 bg-destructive/10">
        <AlertTriangle className="size-6 text-destructive" />
      </div>
      <div className="space-y-2">
        <h1 className="text-balance text-2xl font-semibold tracking-tight md:text-3xl">Something failed</h1>
        <p className="text-pretty text-sm text-muted-foreground">
          We couldn&apos;t complete your authentication. The link may have expired.
        </p>
      </div>

      {params?.error ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-left font-mono text-[11px] leading-5 text-destructive">
          <span className="text-foreground/70">error:</span> {params.error}
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <Button asChild className="rounded-full">
          <Link href="/auth/login">Back to sign in</Link>
        </Button>
        <Button asChild variant="ghost" className="rounded-full">
          <Link href="/">Return home</Link>
        </Button>
      </div>
    </div>
  )
}
