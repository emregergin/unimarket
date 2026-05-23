import { Skeleton } from "@/components/ui/skeleton";
import { ListingGridSkeleton } from "@/components/listing/listing-card-skeleton";

export default function LoadingFeed() {
  return (
    <>
      <header className="sticky top-0 z-30 bg-background safe-top">
        <div className="flex items-center justify-between px-5 pt-3 pb-1">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-xl" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-9 rounded-full" />
            <Skeleton className="h-9 w-9 rounded-full" />
          </div>
        </div>
        <div className="px-5 pt-2">
          <Skeleton className="h-12 w-full rounded-2xl" />
        </div>
        <div className="mt-3 flex gap-2 overflow-hidden px-5 pb-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-20 rounded-full" />
          ))}
        </div>
      </header>
      <main className="px-5 pt-2">
        <Skeleton className="mb-5 h-20 w-full rounded-2xl" />
        <div className="mb-3 flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3 w-16" />
        </div>
        <ListingGridSkeleton count={6} />
      </main>
    </>
  );
}
