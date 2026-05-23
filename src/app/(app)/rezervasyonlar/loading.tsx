import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingReservations() {
  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center justify-center bg-background safe-top">
        <Skeleton className="h-4 w-32" />
      </header>
      <main className="flex flex-col gap-4 px-5 pt-2">
        <div className="flex gap-2 rounded-full bg-muted p-1">
          <Skeleton className="h-9 flex-1 rounded-full" />
          <Skeleton className="h-9 flex-1 rounded-full" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-3 rounded-2xl bg-muted/60 p-5">
            <div className="flex gap-3">
              <Skeleton className="h-16 w-16 rounded-xl" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            </div>
            <Skeleton className="h-10 w-full rounded-2xl" />
          </div>
        ))}
      </main>
    </>
  );
}
