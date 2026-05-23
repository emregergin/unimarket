import Link from "next/link";
import Image from "next/image";
import { MessageCircle, ShieldCheck } from "lucide-react";
import { TopBar } from "@/components/nav/top-bar";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { SELLER } from "@/lib/mock-data";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";

interface ChatRow {
  id: string;
  reservation: {
    buyer_id: string;
    seller_id: string;
    status: string;
    listing: { title: string; images: string[] };
    buyer: { id: string; full_name: string | null; avatar_url: string | null; verified_student: boolean };
    seller: { id: string; full_name: string | null; avatar_url: string | null; verified_student: boolean };
  };
  last: { content: string; created_at: string; sender_id: string }[];
}

export default async function ChatsListPage() {
  const me = await getCurrentUser();
  if (!me) {
    return (
      <>
        <TopBar title="Sohbetler" showBack />
        <main className="px-5 pt-2">
          <p className="text-sm text-muted-foreground">Sohbetler için giriş yap.</p>
        </main>
      </>
    );
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("chats")
    .select(
      `id,
       reservation:reservations!inner(
         buyer_id, seller_id, status,
         listing:listings(title, images),
         buyer:users!reservations_buyer_id_fkey(id, full_name, avatar_url, verified_student),
         seller:users!reservations_seller_id_fkey(id, full_name, avatar_url, verified_student)
       ),
       last:messages(content, created_at, sender_id)`
    )
    .order("created_at", { ascending: false, referencedTable: "messages" })
    .limit(1, { referencedTable: "messages" });

  const rows = ((data as unknown as ChatRow[]) ?? []).map((c) => {
    const r = c.reservation;
    const iAmBuyer = r.buyer_id === me.auth.id;
    const other = iAmBuyer ? r.seller : r.buyer;
    const listing = Array.isArray(r.listing) ? r.listing[0] : r.listing;
    const last = c.last?.[0];
    return { id: c.id, other, listing, last };
  });

  return (
    <>
      <TopBar title="Sohbetler" showBack />
      <main className="flex flex-col gap-3 px-5 pt-2">
        {rows.length === 0 ? (
          <EmptyState
            icon={<MessageCircle className="h-6 w-6" />}
            title="Henüz sohbet yok"
            description="Rezervasyon onaylandığında satıcıyla otomatik bir sohbet açılır."
          />
        ) : (
          <ul className="flex flex-col">
            {rows.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/sohbet/${r.id}`}
                  className="flex items-center gap-3 rounded-2xl px-2 py-3 active:bg-muted transition-colors"
                >
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-muted">
                    <Image
                      src={r.other?.avatar_url ?? SELLER.avatar}
                      alt=""
                      fill
                      sizes="48px"
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-sm font-semibold">
                        {r.other?.full_name ?? "—"}
                      </p>
                      {r.other?.verified_student && (
                        <ShieldCheck className="h-3 w-3 text-info" />
                      )}
                    </div>
                    <p className="truncate text-[12px] text-muted-foreground">
                      {r.last?.content ?? `${r.listing?.title} hakkında sohbet`}
                    </p>
                  </div>
                  {r.last && (
                    <span className="shrink-0 text-[10px] text-muted-foreground">
                      {new Date(r.last.created_at).toLocaleDateString("tr-TR")}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Badge variant="info" size="sm" className="mx-auto mt-4">
          Mesajlar uçtan uca güvenli ve sadece katılımcılara görünür.
        </Badge>
      </main>
    </>
  );
}
