"use client";
import { Heart } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function FavoriteButton({ listingId }: { listingId: string }) {
  const [fav, setFav] = useState(false);
  return (
    <button
      onClick={() => setFav((v) => !v)}
      aria-label={fav ? "Favoriden çıkar" : "Favorilere ekle"}
      data-listing-id={listingId}
      className="flex h-12 w-12 items-center justify-center rounded-full bg-muted active:scale-95 transition"
    >
      <Heart
        className={cn(
          "h-5 w-5 transition-colors",
          fav ? "fill-destructive stroke-destructive" : "text-foreground"
        )}
      />
    </button>
  );
}
