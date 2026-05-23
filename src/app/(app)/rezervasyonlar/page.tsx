import Link from "next/link";
import { Clock, Check, X as XIcon, MessageCircle, Package } from "lucide-react";
import { TopBar } from "@/components/nav/top-bar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { formatPrice } from "@/lib/utils";
import { ReservationActions } from "./reservation-actions";

export const dynamic = "force-dynamic";

type Tab = "incoming" | "outgoing";

interface Row {
  id: string;
  status: "pending" | "accepted" | "rejected" | "cancelled" | "completed";
  message: string | null;
  created_at: string;
  listing: { id: string; title: string; price: number; is_free: boolean; images: string[]; city: string };
  counterparty: { id: string; full_name: string | null; university: string | null; avatar_url: string | null };
  chat_id: string | null;
  already_rated: boolean;
}

export default async function ReservationsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const params = await searchParams;
  const tab: Tab = params.tab === "outgoing" ? "outgoing" : "incoming";

  const me = await getCurrentUser();
  const rows: Row[] = me ? await fetchRows(me.auth.id, tab) : [];

  return (
    <>
      <TopBar title="Rezervasyonlar" />
      <main className="flex flex-col gap-4 px-5 pt-2">
        <div role="tablist" aria-label="Rezervasyon görünümü" className="flex gap-2 rounded-full bg-muted p-1">
          <TabLink active={tab === "incoming"} href="/rezervasyonlar?tab=incoming">
            Gelen İstekler
          </TabLink>
          <TabLink active={tab === "outgoing"} href="/rezervasyonlar?tab=outgoing">
            Gönderdiklerim
          </TabLink>
        </div>

        {rows.length === 0 ? (
          tab === "incoming" ? (
            <EmptyState
              icon={<Package className="h-6 w-6" />}
              title="Henüz gelen istek yok"
              description="İlanlarına biri rezervasyon gönderdiğinde burada görünecek."
            />
          ) : (
            <EmptyState
              icon={<MessageCircle className="h-6 w-6" />}
              title="Henüz rezervasyon göndermedin"
              description="Beğendiğin bir ürüne rezervasyon gönderdiğinde durumu burada takip edebilirsin."
              action={{ label: "Ürünleri Keşfet", href: "/kesfet" }}
            />
          )
        ) : (
          <ul className="flex flex-col gap-3">
            {rows.map((r) => (
              <ReservationCard key={r.id} row={r} viewerRole={tab === "incoming" ? "seller" : "buyer"} />
            ))}
          </ul>
        )}
      </main>
    </>
  );
}

function TabLink({ active, href, children }: { active: boolean; href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      role="tab"
      aria-selected={active}
      className={
        "flex-1 rounded-full px-4 py-2 text-center text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring " +
        (active ? "bg-background text-foreground shadow-card" : "text-muted-foreground")
      }
    >
      {children}
    </Link>
  );
}

function ReservationCard({ row, viewerRole }: { row: Row; viewerRole: "buyer" | "seller" }) {
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex gap-3">
        <Link
          href={`/ilan/${row.listing.id}`}
          className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-background"
          aria-label={row.listing.title}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={row.listing.images[0] ?? "/placeholder.png"}
            alt=""
            className="h-full w-full object-cover"
          />
        </Link>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="line-clamp-1 text-sm font-semibold">{row.listing.title}</p>
          <p className="text-[12px] text-muted-foreground">
            {viewerRole === "buyer" ? "Satıcı: " : "Alıcı: "}
            {row.counterparty.full_name ?? "—"}
          </p>
          <StatusBadge status={row.status} />
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-[13px] font-semibold">
            {row.listing.is_free ? <span className="text-success">ÜCRETSİZ</span> : formatPrice(row.listing.price)}
          </span>
          <span className="text-[11px] text-muted-foreground">
            {new Date(row.created_at).toLocaleDateString("tr-TR")}
          </span>
        </div>
      </div>

      {row.message && (
        <p className="rounded-xl bg-background p-3 text-[13px] leading-relaxed">
          “{row.message}”
        </p>
      )}

      <ReservationActions
        reservationId={row.id}
        status={row.status}
        viewerRole={viewerRole}
        chatId={row.chat_id}
        counterpartyId={row.counterparty.id}
        counterpartyName={row.counterparty.full_name ?? "Kullanıcı"}
        alreadyRated={row.already_rated}
      />
    </Card>
  );
}

function StatusBadge({ status }: { status: Row["status"] }) {
  const map = {
    pending: { variant: "neutral" as const, label: "Onay Bekliyor", icon: <Clock className="h-3 w-3" /> },
    accepted: { variant: "success" as const, label: "Onaylandı", icon: <Check className="h-3 w-3" /> },
    rejected: { variant: "neutral" as const, label: "Reddedildi", icon: <XIcon className="h-3 w-3" /> },
    cancelled: { variant: "neutral" as const, label: "İptal Edildi", icon: <XIcon className="h-3 w-3" /> },
    completed: { variant: "info" as const, label: "Tamamlandı", icon: <Check className="h-3 w-3" /> },
  }[status];
  return (
    <Badge variant={map.variant} size="sm">
      {map.icon} {map.label}
    </Badge>
  );
}

async function fetchRows(userId: string, tab: Tab): Promise<Row[]> {
  try {
    const supabase = await createClient();
    const column = tab === "incoming" ? "seller_id" : "buyer_id";
    const counterColumn = tab === "incoming" ? "buyer_id" : "seller_id";

    const { data, error } = await supabase
      .from("reservations")
      .select(
        `id, status, message, created_at,
         listing:listings(id, title, price, is_free, images, city),
         counterparty:users!reservations_${counterColumn}_fkey(id, full_name, university, avatar_url),
         chat:chats(id)`
      )
      .eq(column, userId)
      .order("created_at", { ascending: false });

    if (error || !data) return [];

    // Second query: which completed reservations did *I* already rate?
    const completedIds = data
      .filter((d) => d.status === "completed")
      .map((d) => d.id as string);
    let myRatedSet = new Set<string>();
    if (completedIds.length > 0) {
      const { data: ratings } = await supabase
        .from("ratings")
        .select("reservation_id")
        .eq("rater_id", userId)
        .in("reservation_id", completedIds);
      myRatedSet = new Set((ratings ?? []).map((r) => r.reservation_id as string));
    }

    return data.map((d): Row => ({
      id: d.id as string,
      status: d.status as Row["status"],
      message: (d.message as string | null) ?? null,
      created_at: d.created_at as string,
      listing: Array.isArray(d.listing) ? d.listing[0] : (d.listing as Row["listing"]),
      counterparty: Array.isArray(d.counterparty)
        ? d.counterparty[0]
        : (d.counterparty as Row["counterparty"]),
      chat_id: Array.isArray(d.chat)
        ? d.chat[0]?.id ?? null
        : ((d.chat as { id: string } | null)?.id ?? null),
      already_rated: myRatedSet.has(d.id as string),
    }));
  } catch {
    return [];
  }
}
