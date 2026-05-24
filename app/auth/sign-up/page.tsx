"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { ArrowRight, Check } from "lucide-react"

export default function SignUpPage() {
  const router = useRouter()
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [repeat, setRepeat] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== repeat) {
      setError("Passwords do not match")
      return
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    setIsLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
      router.push("/auth/sign-up-success")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign up")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
          <span className="size-1.5 rounded-full bg-primary shadow-[0_0_8px_var(--primary)]" />
          <span className="font-mono">free tier &middot; 1,000 checks / mo</span>
        </div>
        <h1 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
          Create your <span className="text-primary">probe</span> account
        </h1>
        <p className="text-pretty text-sm text-muted-foreground">
          Live monitors in 60 seconds. No credit card required.
        </p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <div className="grid gap-2">
          <Label htmlFor="email" className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            email
          </Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="password" className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            password
          </Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11"
          />
          <p className="text-xs text-muted-foreground">At least 8 characters.</p>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="repeat" className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            repeat password
          </Label>
          <Input
            id="repeat"
            type="password"
            autoComplete="new-password"
            required
            value={repeat}
            onChange={(e) => setRepeat(e.target.value)}
            className="h-11"
          />
        </div>

        {error ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </div>
        ) : null}

        <Button type="submit" disabled={isLoading} className="h-11 w-full rounded-full">
          {isLoading ? (
            <>
              <Spinner className="size-4" /> Creating account
            </>
          ) : (
            <>
              Create account <ArrowRight className="ml-1 size-4" />
            </>
          )}
        </Button>

        <ul className="space-y-2 pt-1 text-xs text-muted-foreground">
          <Bullet>1,000 free checks every month, forever</Bullet>
          <Bullet>Unlimited monitors and team members</Bullet>
          <Bullet>Cancel anytime, no credit card required</Bullet>
        </ul>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/auth/login" className="font-medium text-foreground underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <Check className="mt-0.5 size-3.5 text-primary" /> <span>{children}</span>
    </li>
  )
}
