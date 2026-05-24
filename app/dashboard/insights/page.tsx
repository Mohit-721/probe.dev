import { createClient } from "@/lib/supabase/server"
import { PageHeader } from "@/components/dashboard/page-header"
import { InsightsClient } from "@/components/dashboard/insights-client"
import { Sparkles } from "lucide-react"

export default async function InsightsPage() {
  const supabase = await createClient()

  const [{ count: monitorsCount }, { count: failedCount }, { count: openIncidents }] = await Promise.all([
    supabase.from("monitors").select("*", { count: "exact", head: true }),
    supabase
      .from("runs")
      .select("*", { count: "exact", head: true })
      .eq("status", "failed")
      .gte("started_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
    supabase.from("incidents").select("*", { count: "exact", head: true }).eq("status", "open"),
  ])

  return (
    <>
      <PageHeader
        breadcrumb={<span>~ / insights</span>}
        title={
          <span className="inline-flex items-center gap-2">
            AI Insights
            <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-primary">
              <Sparkles className="size-3" /> beta
            </span>
          </span>
        }
        description="Ask anything about your monitors. Probe analyzes recent runs, incidents, and assertion failures using your configured AI model."
      />

      <div className="px-4 py-6 md:px-8 md:py-8">
        <InsightsClient
          monitorsCount={monitorsCount ?? 0}
          failedRuns24h={failedCount ?? 0}
          openIncidents={openIncidents ?? 0}
        />
      </div>
    </>
  )
}
