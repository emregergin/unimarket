import { Skeleton } from "@/components/ui/skeleton";
import { ListingGridSkeleton } from "@/components/listing/listing-card-skeleton";

export default function LoadingFavorites() {
  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center justify-center bg-background safe-top">
        <Skeleton className="h-4 w-20" />
      </header>
      <main className="px-5 pt-2">
        <Skeleton className="mb-3 h-3 w-32" />
        <ListingGridSkeleton count={6} />
      </main>
    </>
  );
}
