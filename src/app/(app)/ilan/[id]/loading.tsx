import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingListing() {
  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between bg-background px-2 safe-top">
        <Skeleton className="h-9 w-9 rounded-full" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-9 w-9 rounded-full" />
      </header>
      <main className="pb-32">
        <div className="px-5 pt-2">
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <Skeleton className="my-3 mx-5 aspect-square rounded-2xl" />
        <section className="px-5 pt-2 flex flex-col gap-3">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-3 w-40" />
        </section>
        <section className="px-5 pt-5">
          <div className="flex flex-col gap-3 rounded-2xl bg-muted/60 p-5">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </section>
        <section className="px-5 pt-5">
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-muted/60 p-5">
            <Skeleton className="h-16 w-16 rounded-full" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24 rounded-full" />
          </div>
        </section>
      </main>
    </>
  );
}
