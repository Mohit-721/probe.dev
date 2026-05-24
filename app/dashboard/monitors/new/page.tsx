import { PageHeader } from "@/components/dashboard/page-header"
import { NewMonitorForm } from "@/components/dashboard/new-monitor-form"
import Link from "next/link"

export default function NewMonitorPage() {
  return (
    <>
      <PageHeader
        breadcrumb={
          <span>
            ~ / <Link href="/dashboard/monitors" className="hover:text-foreground">monitors</Link> / new
          </span>
        }
        title="New monitor"
        description="Define a single HTTP probe. You can extend it into a multi-step flow once it's running."
      />
      <div className="px-4 py-6 md:px-8 md:py-8">
        <NewMonitorForm />
      </div>
    </>
  )
}
