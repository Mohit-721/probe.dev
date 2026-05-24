import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <>
      <header className="border-b border-border px-4 py-5 md:px-8 md:py-6">
        <Skeleton className="h-3 w-40" />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <Skeleton className="h-8 w-48" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-9 w-24 rounded-full" />
          </div>
        </div>
      </header>
      <div className="space-y-6 px-4 py-6 md:px-8 md:py-8">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[80px] rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-[260px] rounded-xl" />
        <Skeleton className="h-[120px] rounded-xl" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
          <Skeleton className="h-[400px] rounded-xl" />
          <div className="space-y-4">
            <Skeleton className="h-[180px] rounded-xl" />
            <Skeleton className="h-[200px] rounded-xl" />
          </div>
        </div>
      </div>
    </>
  )
}
