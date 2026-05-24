import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
  return (
    <>
      <header className="border-b border-border px-4 py-5 md:px-8 md:py-6">
        <Skeleton className="h-3 w-24" />
        <div className="mt-3 flex items-center justify-between gap-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-9 w-32 rounded-full" />
        </div>
        <Skeleton className="mt-3 h-3.5 w-72" />
      </header>

      <div className="space-y-8 px-4 py-6 md:px-8 md:py-8">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[88px] rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[152px] rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-[280px] rounded-xl" />
      </div>
    </>
  )
}
