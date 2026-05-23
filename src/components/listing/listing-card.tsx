"use client";
import Link from "next/link";
import Image from "next/image";
import { Heart, MapPin } from "lucide-react";
import { useState, useTransition } from "react";
import { cn, formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { toggleFavoriteAction } from "@/app/(app)/favoriler/actions";

export interface ListingCardData {
  id: string;
  title: string;
  price: number;
  isFree: boolean;
  image: string;
  city: string;
  isEco?: boolean;
  sellerVerified?: boolean;
}

interface Props {
  listing: ListingCardData;
  initialFavorite?: boolean;
}

export function ListingCard({ listing, initialFavorite = false }: Props) {
  const [fav, setFav] = useState(initialFavorite);
  const [, startTransition] = useTransition();

  const toggleFav = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = !fav;
    setFav(next); // optimistic
    startTransition(async () => {
      const res = await toggleFavoriteAction({ listingId: listing.id, favorite: next });
      if (!res.ok) setFav(!next); // rollback
    });
  };

  return (
    <Link
      href={`/ilan/${listing.id}`}
      className="group flex flex-col gap-2 active:scale-[0.99] transition-transform"
    >
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted">
        <Image
          src={listing.image}
          alt={listing.title}
          fill
          sizes="(max-width: 640px) 50vw, 240px"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          unoptimized
        />
        <button
          onClick={toggleFav}
          aria-label={fav ? "Favoriden çıkar" : "Favorilere ekle"}
          className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-background/90 backdrop-blur shadow-card active:scale-95 transition"
        >
          <Heart
            className={cn(
              "h-[18px] w-[18px] transition-colors",
              fav ? "fill-destructive stroke-destructive" : "text-foreground"
            )}
          />
        </button>
        {listing.isFree && (
          <div className="absolute left-2 bottom-2">
            <Badge variant="success" size="sm">ÜCRETSİZ</Badge>
          </div>
        )}
        {listing.isEco && !listing.isFree && (
          <div className="absolute left-2 bottom-2">
            <Badge variant="success" size="sm">Eko-Etki</Badge>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1 px-0.5">
        <h3 className="line-clamp-2 text-[13px] font-medium leading-snug text-foreground">
          {listing.title}
        </h3>
        <div className="flex items-center justify-between gap-2">
          {listing.isFree ? (
            <span className="text-sm font-semibold text-success">ÜCRETSİZ</span>
          ) : (
            <span className="text-sm font-semibold text-foreground">
              {formatPrice(listing.price)}
            </span>
          )}
          {listing.sellerVerified && (
            <Badge variant="info" size="sm" className="shrink-0">Onaylı</Badge>
          )}
        </div>
        <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <MapPin className="h-3 w-3" />
          {listing.city}
        </p>
      </div>
    </Link>
  );
}
