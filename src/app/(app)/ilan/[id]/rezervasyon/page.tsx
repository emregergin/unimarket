import { notFound } from "next/navigation";
import { ShieldCheck, Calendar, MapPin } from "lucide-react";
import { TopBar } from "@/components/nav/top-bar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MOCK_LISTINGS } from "@/lib/mock-data";
import { formatPrice } from "@/lib/utils";
import { ReserveForm } from "./reserve-form";

export default async function ReservationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // In Stage 3+ this fetches from Supabase instead of mock data.
  const listing = MOCK_LISTINGS.find((l) => l.id === id);
  if (!listing) notFound();

  return (
    <>
      <TopBar title="Rezervasyon İsteği" showBack />
      <main className="flex flex-col gap-5 px-5 pb-10 pt-2">
        <Card className="flex gap-3">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-background">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={listing.image} alt="" className="h-full w-full object-cover" />
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <p className="line-clamp-2 text-sm font-medium">{listing.title}</p>
            <p className="text-[13px] font-semibold">
              {listing.isFree ? (
                <span className="text-success">ÜCRETSİZ</span>
              ) : (
                formatPrice(listing.price)
              )}
            </p>
            <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <MapPin className="h-3 w-3" /> {listing.city}
            </p>
          </div>
        </Card>

        <div className="flex flex-col gap-2">
          <Badge variant="info" size="lg" className="self-start">
            <ShieldCheck className="h-3.5 w-3.5" /> Güvenli Süreç
          </Badge>
          <h1 className="text-2xl font-bold tracking-tight">Satıcıya kısa bir not yaz</h1>
          <p className="text-[14px] leading-relaxed text-muted-foreground">
            Satıcı isteğini onayladığında otomatik olarak güvenli bir sohbet
            açılır. Buluşma yerini ve zamanını birlikte belirleyebilirsin.
          </p>
        </div>

        <ReserveForm listingId={listing.id} />

        <ul className="flex flex-col gap-2 rounded-2xl border border-border p-4">
          <Step n={1} title="İstek gönder" desc="Satıcıya bildirim gider." />
          <Step n={2} title="Onay bekle" desc="Genellikle bir gün içinde yanıtlanır." />
          <Step n={3} title="Sohbet açılır" desc="Buluşmayı birlikte planlarsın." />
        </ul>
      </main>
    </>
  );
}

function Step({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <li className="flex items-start gap-3">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-muted text-[12px] font-bold">
        {n}
      </span>
      <div className="flex flex-col">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-[12px] text-muted-foreground">{desc}</p>
      </div>
    </li>
  );
}
