import { Heart } from "lucide-react";
import { TopBar } from "@/components/nav/top-bar";
import { ListingCard } from "@/components/listing/listing-card";
import { EmptyState } from "@/components/ui/empty-state";
import { MOCK_LISTINGS } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import type { ListingCardData } from "@/components/listing/listing-card";

export const dynamic = "force-dynamic";

const PUBLIC_BUCKET_URL = (path: string) =>
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/listings/${path}`;

export default async function FavoritesPage() {
  let favs: ListingCardData[];

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    favs = MOCK_LISTINGS.slice(0, 4);
  } else {
    const me = await getCurrentUser();
    if (!me) {
      favs = [];
    } else {
      const supabase = await createClient();
      const { data } = await supabase
        .from("favorites")
        .select(
          `listing:listings!inner(id, title, price, is_free, images, city,
            seller:users!listings_seller_id_fkey(verified_student))`
        )
        .eq("user_id", me.auth.id)
        .order("created_at", { ascending: false });
      favs = ((data ?? []) as unknown as {
        listing: {
          id: string;
          title: string;
          price: number;
          is_free: boolean;
          images: string[];
          city: string;
          seller: { verified_student: boolean } | { verified_student: boolean }[];
        };
      }[]).map((row) => {
        const l = row.listing;
        const seller = Array.isArray(l.seller) ? l.seller[0] : l.seller;
        return {
          id: l.id,
          title: l.title,
          price: l.price,
          isFree: l.is_free,
          image: l.images?.[0] ? PUBLIC_BUCKET_URL(l.images[0]) : "/placeholder.png",
          city: l.city,
          sellerVerified: seller?.verified_student ?? false,
        };
      });
    }
  }

  return (
    <>
      <TopBar title="Favoriler" />
      <main className="px-5 pt-2">
        {favs.length === 0 ? (
          <EmptyState
            icon={<Heart className="h-6 w-6" />}
            title="Henüz favori yok"
            description="Beğendiğin ürünlerin kalp ikonuna dokun, burada birikecek."
            action={{ label: "Ürünleri Keşfet", href: "/kesfet" }}
          />
        ) : (
          <>
            <p className="mb-3 text-[12px] text-muted-foreground">
              {favs.length} kaydedilmiş ilan
            </p>
            <div className="grid grid-cols-2 gap-3">
              {favs.map((l) => (
                <ListingCard key={l.id} listing={l} initialFavorite />
              ))}
            </div>
          </>
        )}
      </main>
    </>
  );
}
