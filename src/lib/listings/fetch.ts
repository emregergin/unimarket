import { createClient } from "@/lib/supabase/server";
import type { ListingCardData } from "@/components/listing/listing-card";
import { MOCK_LISTINGS } from "@/lib/mock-data";

const PUBLIC_BUCKET_URL = (path: string) =>
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/listings/${path}`;

export interface FeedListing extends ListingCardData {
  category: string;
}

export interface FeedQuery {
  category?: string;
  search?: string;
  city?: string;
  freeOnly?: boolean;
  limit?: number;
  offset?: number;
}

export async function fetchFeed(q: FeedQuery = {}): Promise<FeedListing[]> {
  // Fallback to mock data if Supabase isn't configured (UI preview mode)
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return MOCK_LISTINGS.filter((l) => {
      if (q.freeOnly && !l.isFree) return false;
      if (q.category && q.category !== "all" && q.category !== "free" && l.category !== q.category)
        return false;
      if (q.search && !l.title.toLowerCase().includes(q.search.toLowerCase())) return false;
      return true;
    }).slice(q.offset ?? 0, (q.offset ?? 0) + (q.limit ?? 30));
  }

  const supabase = await createClient();
  let query = supabase
    .from("listings")
    .select(
      `id, title, price, is_free, images, city, category,
       seller:users!listings_seller_id_fkey(verified_student)`
    )
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .range(q.offset ?? 0, (q.offset ?? 0) + (q.limit ?? 30) - 1);

  if (q.freeOnly || q.category === "free") query = query.eq("is_free", true);
  else if (q.category && q.category !== "all") query = query.eq("category", q.category);
  if (q.city) query = query.eq("city", q.city);
  if (q.search) query = query.ilike("title", `%${q.search}%`);

  const { data, error } = await query;
  if (error || !data) {
    console.error("[fetchFeed]", error);
    return [];
  }

  return data.map((d): FeedListing => {
    const seller = Array.isArray(d.seller) ? d.seller[0] : d.seller;
    const firstImage = d.images?.[0];
    return {
      id: d.id as string,
      title: d.title as string,
      price: d.price as number,
      isFree: d.is_free as boolean,
      image: firstImage ? PUBLIC_BUCKET_URL(firstImage) : "/placeholder.png",
      city: d.city as string,
      category: d.category as string,
      sellerVerified: seller?.verified_student ?? false,
    };
  });
}

export async function fetchListing(id: string) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return MOCK_LISTINGS.find((l) => l.id === id) ?? null;
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("listings")
    .select(
      `id, title, description, price, is_free, images, city, pickup_location, category, condition, status, created_at,
       seller:users!listings_seller_id_fkey(id, full_name, university, avatar_url, verified_student, rating_avg, rating_count)`
    )
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  return {
    ...data,
    image: data.images?.[0] ? PUBLIC_BUCKET_URL(data.images[0]) : "/placeholder.png",
    images: (data.images ?? []).map(PUBLIC_BUCKET_URL),
  };
}
