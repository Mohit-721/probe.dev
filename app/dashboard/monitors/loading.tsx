import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <>
      <header className="border-b border-border px-4 py-5 md:px-8 md:py-6">
        <Skeleton className="h-3 w-32" />
        <div className="mt-3 flex items-center justify-between gap-3">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-9 w-36 rounded-full" />
        </div>
      </header>
      <div className="space-y-3 px-4 py-6 md:px-8 md:py-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[72px] rounded-xl" />
        ))}
      </div>
    </>
  )
}
