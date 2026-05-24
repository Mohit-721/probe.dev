import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/dashboard/page-header"
import { Card } from "@/components/ui/card"
import { SignOutButton } from "@/components/dashboard/sign-out-button"

export const dynamic = "force-dynamic"

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Account, workspace, and integrations." />

      <Card className="rounded-2xl border-border/60 bg-card p-6">
        <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">Account</h3>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-muted-foreground">Email</dt>
            <dd className="font-mono">{user.email}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-muted-foreground">User ID</dt>
            <dd className="truncate font-mono text-xs text-muted-foreground">{user.id}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-muted-foreground">Joined</dt>
            <dd className="font-mono text-xs">{new Date(user.created_at).toLocaleDateString()}</dd>
          </div>
        </dl>
        <div className="mt-6 border-t border-border/60 pt-6">
          <SignOutButton />
        </div>
      </Card>

      <Card className="rounded-2xl border-border/60 bg-card p-6">
        <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">Notifications</h3>
        <p className="mt-4 text-sm text-muted-foreground">
          Slack, email, and webhook delivery is coming soon. For now, all incidents are visible in your dashboard.
        </p>
      </Card>
    </div>
  )
}
