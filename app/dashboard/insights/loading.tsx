import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <>
      <header className="border-b border-border px-4 py-5 md:px-8 md:py-6">
        <Skeleton className="h-3 w-24" />
        <div className="mt-3 flex items-center gap-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
        <Skeleton className="mt-3 h-3.5 w-80" />
      </header>
      <div className="grid grid-cols-1 gap-6 px-4 py-6 md:px-8 md:py-8 lg:grid-cols-[1fr_300px]">
        <Skeleton className="h-[500px] rounded-2xl" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[80px] rounded-xl" />
          ))}
        </div>
      </div>
    </>
  )
}
