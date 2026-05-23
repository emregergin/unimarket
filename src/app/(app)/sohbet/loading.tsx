import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingChats() {
  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between bg-background px-2 safe-top">
        <Skeleton className="h-9 w-9 rounded-full" />
        <Skeleton className="h-4 w-24" />
        <span className="h-9 w-9" />
      </header>
      <main className="flex flex-col gap-1 px-5 pt-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-2 py-3">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-2.5 w-10" />
          </div>
        ))}
      </main>
    </>
  );
}
