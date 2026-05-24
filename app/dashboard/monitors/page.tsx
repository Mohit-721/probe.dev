import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/dashboard/page-header"
import { NoMonitorsEmpty } from "@/components/dashboard/no-monitors-empty"
import { MonitorsListClient } from "@/components/dashboard/monitors-list-client"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import type { Monitor } from "@/lib/types"

export default async function MonitorsListPage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from("monitors")
    .select("*")
    .order("created_at", { ascending: false })

  const monitors = (data ?? []) as Monitor[]

  return (
    <>
      <PageHeader
        breadcrumb={<span>~ / monitors</span>}
        title="Monitors"
        description="Every probe in your workspace. Click any row to dive into runs and assertions."
        actions={
          <Button asChild className="rounded-full">
            <Link href="/dashboard/monitors/new">
              <Plus className="mr-1.5 size-4" /> New monitor
            </Link>
          </Button>
        }
      />

      <div className="px-4 py-6 md:px-8 md:py-8">
        {monitors.length === 0 ? <NoMonitorsEmpty /> : <MonitorsListClient monitors={monitors} />}
      </div>
    </>
  )
}
