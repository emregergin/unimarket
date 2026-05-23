import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, MapPin } from "lucide-react";
import { TopBar } from "@/components/nav/top-bar";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { formatPrice } from "@/lib/utils";
import { ChatRoom } from "./chat-room";

export const dynamic = "force-dynamic";

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await getCurrentUser();
  if (!me) redirect("/giris");

  const supabase = await createClient();
  const { data: chat } = await supabase
    .from("chats")
    .select(
      `id, created_at,
       reservation:reservations(
         id, status, buyer_id, seller_id,
         listing:listings(id, title, price, is_free, images, city, pickup_location),
         buyer:users!reservations_buyer_id_fkey(id, full_name, university, avatar_url, verified_student),
         seller:users!reservations_seller_id_fkey(id, full_name, university, avatar_url, verified_student)
       )`
    )
    .eq("id", id)
    .maybeSingle();

  if (!chat) notFound();
  const reservation = Array.isArray(chat.reservation) ? chat.reservation[0] : chat.reservation;
  if (!reservation) notFound();

  const meIsBuyer = reservation.buyer_id === me.auth.id;
  const meIsSeller = reservation.seller_id === me.auth.id;
  if (!meIsBuyer && !meIsSeller) notFound();

  const counterparty = meIsBuyer
    ? (Array.isArray(reservation.seller) ? reservation.seller[0] : reservation.seller)
    : (Array.isArray(reservation.buyer) ? reservation.buyer[0] : reservation.buyer);

  const listing = Array.isArray(reservation.listing) ? reservation.listing[0] : reservation.listing;

  // Initial messages (latest 50, ascending for display)
  const { data: initialMessages } = await supabase
    .from("messages")
    .select("id, sender_id, content, created_at, read_at")
    .eq("chat_id", id)
    .order("created_at", { ascending: true })
    .limit(50);

  return (
    <div className="flex h-screen flex-col bg-background">
      <TopBar
        title={counterparty?.full_name ?? "Sohbet"}
        showBack
        rightSlot={
          counterparty?.verified_student ? (
            <span className="grid h-9 w-9 place-items-center rounded-full bg-info-bg text-info">
              <ShieldCheck className="h-4 w-4" />
            </span>
          ) : undefined
        }
      />

      {/* Pinned listing context */}
      <Link
        href={`/ilan/${listing.id}`}
        className="mx-3 mb-2 flex gap-3 rounded-2xl bg-muted p-3 active:scale-[0.99] transition"
      >
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-background">
          <Image
            src={listing.images?.[0] ?? "/placeholder.png"}
            alt=""
            fill
            sizes="48px"
            className="object-cover"
            unoptimized
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <p className="line-clamp-1 text-[13px] font-semibold">{listing.title}</p>
          <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {listing.pickup_location ?? listing.city}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[13px] font-bold">
            {listing.is_free ? (
              <span className="text-success">ÜCRETSİZ</span>
            ) : (
              formatPrice(listing.price)
            )}
          </p>
          {reservation.status === "accepted" && (
            <Badge variant="success" size="sm">Onaylı</Badge>
          )}
        </div>
      </Link>

      <ChatRoom
        chatId={id}
        myUserId={me.auth.id}
        initialMessages={initialMessages ?? []}
        canSend={reservation.status === "accepted"}
      />
    </div>
  );
}
