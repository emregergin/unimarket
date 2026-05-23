import { Bell } from "lucide-react";
import { TopBar } from "@/components/nav/top-bar";
import { ThemeToggle } from "@/components/theme-toggle";
import { ListingCard } from "@/components/listing/listing-card";
import { Badge } from "@/components/ui/badge";
import { CATEGORIES } from "@/lib/mock-data";
import { fetchFeed } from "@/lib/listings/fetch";
import { EmptyState } from "@/components/ui/empty-state";
import { FeedControls } from "./feed-controls";
import Link from "next/link";
import { Search } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const params = await searchParams;
  const category = params.category ?? "all";
  const search = params.q?.trim() ?? "";

  const listings = await fetchFeed({
    category,
    search: search || undefined,
    freeOnly: category === "free",
    limit: 40,
  });

  const freeCount = listings.filter((l) => l.isFree).length;

  return (
    <>
      <header className="sticky top-0 z-30 bg-background/85 backdrop-blur-md safe-top">
        <div className="flex items-center justify-between px-5 pt-3 pb-1">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground text-sm font-bold">
              U
            </div>
            <span className="text-base font-semibold tracking-tight">UniMarket</span>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <button
              aria-label="Bildirimler"
              className="relative flex h-11 w-11 items-center justify-center rounded-full active:bg-muted"
            >
              <Bell className="h-5 w-5" />
            </button>
          </div>
        </div>

        <FeedControls
          categories={CATEGORIES}
          activeCategory={category}
          initialSearch={search}
        />
      </header>

      <main className="px-5 pt-2">
        {category === "all" && (
          <section className="mb-5 flex items-center justify-between gap-3 rounded-2xl bg-success-bg p-4">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <Badge variant="success" size="sm">ÜCRETSİZ</Badge>
                <span className="text-[11px] font-medium text-success">Bugün</span>
              </div>
              <p className="mt-1.5 text-sm font-semibold text-foreground">
                {freeCount} öğrenci ücretsiz ürün paylaşıyor
              </p>
              <p className="text-[12px] text-muted-foreground">
                Sürdürülebilir öğrenci ekonomisine katıl.
              </p>
            </div>
            <Link
              href="/kesfet?category=free"
              className="shrink-0 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
            >
              Keşfet
            </Link>
          </section>
        )}

        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[17px] font-semibold tracking-tight">
            {category === "free" ? "Ücretsiz Ürünler" : search ? `“${search}” sonuçları` : "Sana Özel"}
          </h2>
          <span className="text-[12px] text-muted-foreground">{listings.length} ürün</span>
        </div>

        {listings.length === 0 ? (
          <EmptyState
            icon={<Search className="h-6 w-6" />}
            title="Sonuç bulunamadı"
            description="Farklı bir kategori veya arama terimi dene."
          />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {listings.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
