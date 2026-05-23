import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  MapPin,
  Ruler,
  Tag,
  ShieldCheck,
  Star,
  Leaf,
} from "lucide-react";
import { TopBar } from "@/components/nav/top-bar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ListingCard } from "@/components/listing/listing-card";
import { MOCK_LISTINGS, SELLER } from "@/lib/mock-data";
import { fetchFeed, fetchListing } from "@/lib/listings/fetch";
import { CATEGORY_LABELS, CONDITION_LABELS } from "@/lib/validators/listing";
import { formatPrice, formatDistance } from "@/lib/utils";
import { FavoriteButton } from "./favorite-button";
import { ReportDialog } from "@/components/listing/report-dialog";
import { ImageCarousel } from "./image-carousel";

export const dynamic = "force-dynamic";

// Shape returned by fetchListing when the backend is configured.
interface DbListing {
  id: string;
  title: string;
  description: string;
  category: string;
  condition: string;
  price: number;
  is_free: boolean;
  images: string[];
  city: string;
  pickup_location: string | null;
  status: string;
  created_at: string;
  image?: string;
  seller:
    | {
        id: string;
        full_name: string | null;
        university: string | null;
        avatar_url: string | null;
        verified_student: boolean;
        rating_avg: number;
        rating_count: number;
      }
    | null;
}

function isDbListing(x: unknown): x is DbListing {
  return !!x && typeof x === "object" && "is_free" in (x as Record<string, unknown>);
}

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await fetchListing(id);

  if (!data) {
    const mock = MOCK_LISTINGS.find((l) => l.id === id);
    if (!mock) notFound();
    return <MockDetail listing={mock} />;
  }

  if (!isDbListing(data)) {
    // Mock path (fetchListing returned a MOCK_LISTINGS entry)
    return <MockDetail listing={data as (typeof MOCK_LISTINGS)[number]} />;
  }

  return <DbDetail listing={data} />;
}

async function DbDetail({ listing }: { listing: DbListing }) {
  const seller = Array.isArray(listing.seller) ? listing.seller[0] : listing.seller;
  const images = listing.images.length > 0 ? listing.images : ["/placeholder.png"];

  const similar = await fetchFeed({ category: listing.category, limit: 4 });

  return (
    <>
      <TopBar title="UniMarket" showBack showBell />
      <main className="pb-32">
        <div className="px-5 pt-2 flex gap-1.5">
          {listing.is_free && <Badge variant="success" size="sm">ÜCRETSİZ</Badge>}
        </div>

        <ImageCarousel images={images} alt={listing.title} />

        <section className="px-5 pt-2">
          <h1 className="text-[22px] font-bold leading-tight tracking-tight">{listing.title}</h1>
          <div className="mt-3 flex items-end justify-between gap-3">
            {listing.is_free ? (
              <span className="text-3xl font-bold text-success">ÜCRETSİZ</span>
            ) : (
              <span className="text-3xl font-bold">{formatPrice(listing.price)}</span>
            )}
            <Badge variant="neutral" size="md">
              {CONDITION_LABELS[listing.condition as keyof typeof CONDITION_LABELS] ?? listing.condition}
            </Badge>
          </div>
          <p className="mt-2 flex items-center gap-1.5 text-[13px] text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            {listing.pickup_location ? `${listing.pickup_location} • ${listing.city}` : listing.city}
          </p>
        </section>

        <section className="px-5 pt-5">
          <Card className="flex flex-col gap-4">
            <h2 className="text-[17px] font-semibold">Detaylar</h2>
            <p className="text-[14px] leading-relaxed text-muted-foreground">{listing.description}</p>
            <div className="flex flex-wrap gap-2 pt-1">
              <AttrPill
                icon={<Tag className="h-4 w-4" />}
                label="Kategori"
                value={CATEGORY_LABELS[listing.category as keyof typeof CATEGORY_LABELS] ?? listing.category}
              />
            </div>
          </Card>
        </section>

        {seller && (
          <section className="px-5 pt-5">
            <Card className="flex flex-col items-center gap-3 text-center">
              <div className="relative h-16 w-16 overflow-hidden rounded-full ring-2 ring-background">
                <Image
                  src={seller.avatar_url ?? SELLER.avatar}
                  alt={seller.full_name ?? "Satıcı"}
                  fill
                  sizes="64px"
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div className="flex flex-col items-center gap-1">
                <p className="text-base font-semibold">{seller.full_name ?? "Satıcı"}</p>
                {seller.verified_student && (
                  <Badge variant="info" size="sm">
                    <ShieldCheck className="h-3 w-3" /> Doğrulanmış Öğrenci
                  </Badge>
                )}
              </div>
              {seller.rating_count > 0 && (
                <div className="flex items-center gap-1.5 text-sm">
                  <Star className="h-4 w-4 fill-foreground text-foreground" />
                  <span className="font-semibold">{Number(seller.rating_avg).toFixed(1)}</span>
                  <span className="text-muted-foreground">({seller.rating_count} değerlendirme)</span>
                </div>
              )}
              {seller.university && (
                <p className="text-[12px] text-muted-foreground">{seller.university}</p>
              )}
            </Card>
          </section>
        )}

        {similar.filter((s) => s.id !== listing.id).length > 0 && (
          <section className="px-5 pt-6">
            <h2 className="mb-3 text-[17px] font-semibold tracking-tight">Benzer Ürünler</h2>
            <div className="grid grid-cols-2 gap-3">
              {similar.filter((s) => s.id !== listing.id).slice(0, 2).map((s) => (
                <ListingCard key={s.id} listing={s} />
              ))}
            </div>
          </section>
        )}

        <div className="px-5 pt-6">
          <ReportDialog
            targetType="listing"
            targetId={listing.id}
            sellerId={seller?.id}
            sellerName={seller?.full_name ?? undefined}
          />
        </div>
      </main>

      <StickyBar listingId={listing.id} isFree={listing.is_free} price={listing.price} />
    </>
  );
}

function MockDetail({ listing }: { listing: (typeof MOCK_LISTINGS)[number] }) {
  const similar = MOCK_LISTINGS.filter((l) => l.id !== listing.id).slice(0, 2);
  const images = [listing.image, listing.image, listing.image];
  return (
    <>
      <TopBar title="UniMarket" showBack showBell />
      <main className="pb-32">
        <div className="px-5 pt-2 flex gap-1.5">
          {listing.isEco && (
            <Badge variant="success" size="sm">
              <Leaf className="h-3 w-3" /> Eko-Etki
            </Badge>
          )}
          {listing.isFree && <Badge variant="success" size="sm">ÜCRETSİZ</Badge>}
        </div>
        <ImageCarousel images={images} alt={listing.title} />
        <section className="px-5 pt-2">
          <h1 className="text-[22px] font-bold leading-tight tracking-tight">{listing.title}</h1>
          <div className="mt-3 flex items-end justify-between gap-3">
            {listing.isFree ? (
              <span className="text-3xl font-bold text-success">ÜCRETSİZ</span>
            ) : (
              <span className="text-3xl font-bold">{formatPrice(listing.price)}</span>
            )}
            <Badge variant="neutral" size="md">{listing.condition}</Badge>
          </div>
          <p className="mt-2 flex items-center gap-1.5 text-[13px] text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            {listing.city} • {formatDistance(listing.distance)}
          </p>
        </section>
        <section className="px-5 pt-5">
          <Card className="flex flex-col gap-4">
            <h2 className="text-[17px] font-semibold">Detaylar</h2>
            <p className="text-[14px] leading-relaxed text-muted-foreground">{listing.description}</p>
            <div className="flex flex-wrap gap-2 pt-1">
              <AttrPill icon={<Ruler className="h-4 w-4" />} label="Boyutlar" value="48x24x32 cm" />
              <AttrPill icon={<Tag className="h-4 w-4" />} label="Kategori" value="Mobilya" />
            </div>
          </Card>
        </section>
        <section className="px-5 pt-5">
          <Card className="flex flex-col items-center gap-3 text-center">
            <div className="relative h-16 w-16 overflow-hidden rounded-full ring-2 ring-background">
              <Image src={SELLER.avatar} alt={SELLER.name} fill sizes="64px" className="object-cover" />
            </div>
            <div className="flex flex-col items-center gap-1">
              <p className="text-base font-semibold">{SELLER.name}</p>
              <Badge variant="info" size="sm">
                <ShieldCheck className="h-3 w-3" /> Doğrulanmış Öğrenci
              </Badge>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <Star className="h-4 w-4 fill-foreground text-foreground" />
              <span className="font-semibold">{SELLER.rating}</span>
              <span className="text-muted-foreground">({SELLER.ratingCount} değerlendirme)</span>
            </div>
            <p className="text-[12px] text-muted-foreground">{SELLER.university}</p>
          </Card>
        </section>
        <section className="px-5 pt-6">
          <h2 className="mb-3 text-[17px] font-semibold tracking-tight">Benzer Ürünler</h2>
          <div className="grid grid-cols-2 gap-3">
            {similar.map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
        </section>
        {/* Report disabled in mock/preview mode (IDs are not UUIDs). */}
      </main>
      <StickyBar listingId={listing.id} isFree={listing.isFree} price={listing.price} />
    </>
  );
}

function StickyBar({ listingId, isFree, price }: { listingId: string; isFree: boolean; price: number }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur-md shadow-sticky safe-bottom">
      <div className="mx-auto flex max-w-md items-center gap-3 px-4 py-3">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Toplam Fiyat</span>
          <span className="text-base font-bold">{isFree ? "Ücretsiz" : formatPrice(price)}</span>
        </div>
        <FavoriteButton listingId={listingId} />
        <Link href={`/ilan/${listingId}/rezervasyon`} className="flex-1">
          <Button size="lg" className="w-full">Rezervasyon İsteği Gönder</Button>
        </Link>
      </div>
    </div>
  );
}

function AttrPill({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-background px-3 py-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-foreground">{icon}</div>
      <div className="flex flex-col">
        <span className="text-[11px] text-muted-foreground">{label}</span>
        <span className="text-[12px] font-medium">{value}</span>
      </div>
    </div>
  );
}
