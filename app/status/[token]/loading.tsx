import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="min-h-svh bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 md:px-6">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </header>
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-10 md:px-6 md:py-16">
        <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
          <div className="space-y-3">
            <Skeleton className="h-6 w-40 rounded-full" />
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <Skeleton className="size-[180px] rounded-full md:size-[220px]" />
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[80px] rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-[200px] rounded-2xl" />
        <Skeleton className="h-[260px] rounded-2xl" />
      </main>
    </div>
  )
}
