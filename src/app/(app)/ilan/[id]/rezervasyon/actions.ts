"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireVerifiedUser } from "@/lib/auth/get-current-user";

const reserveSchema = z.object({
  listingId: z.string().uuid(),
  message: z.string().trim().max(500).optional(),
});

export type ReserveResult =
  | { ok: true; reservationId: string }
  | { ok: false; error: string };

/**
 * Sends a reservation request. Hard requirements (enforced both here and by RLS):
 *  - User signed in AND verified_student=true
 *  - Listing is active
 *  - User is NOT the seller
 *  - User doesn't already have a pending/accepted reservation on this listing
 */
export async function createReservationAction(
  raw: z.infer<typeof reserveSchema>
): Promise<ReserveResult> {
  const parsed = reserveSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  let me;
  try {
    me = await requireVerifiedUser();
  } catch (e) {
    const msg = (e as Error).message;
    if (msg === "UNAUTHENTICATED") return { ok: false, error: "Giriş yapmalısın." };
    if (msg === "NOT_VERIFIED")
      return { ok: false, error: "Rezervasyon için öğrenci doğrulaması gerekli." };
    throw e;
  }

  const supabase = await createClient();
  const { data: listing, error: listingErr } = await supabase
    .from("listings")
    .select("id, seller_id, status")
    .eq("id", parsed.data.listingId)
    .maybeSingle();

  if (listingErr || !listing) return { ok: false, error: "İlan bulunamadı." };
  if (listing.status !== "active") return { ok: false, error: "Bu ilan artık aktif değil." };
  if (listing.seller_id === me.auth.id)
    return { ok: false, error: "Kendi ilanına rezervasyon yapamazsın." };

  // Check for existing active reservation
  const { data: existing } = await supabase
    .from("reservations")
    .select("id, status")
    .eq("listing_id", listing.id)
    .eq("buyer_id", me.auth.id)
    .in("status", ["pending", "accepted"])
    .maybeSingle();
  if (existing) {
    return { ok: false, error: "Bu ilan için zaten aktif bir rezervasyonun var." };
  }

  const { data: row, error } = await supabase
    .from("reservations")
    .insert({
      listing_id: listing.id,
      buyer_id: me.auth.id,
      seller_id: listing.seller_id,
      message: parsed.data.message ?? null,
      status: "pending",
    })
    .select("id")
    .single();

  if (error || !row) return { ok: false, error: error?.message ?? "Rezervasyon oluşturulamadı." };

  revalidatePath(`/ilan/${listing.id}`);
  revalidatePath("/rezervasyonlar");
  return { ok: true, reservationId: row.id };
}

const respondSchema = z.object({
  reservationId: z.string().uuid(),
  accept: z.boolean(),
});

export async function respondReservationAction(
  raw: z.infer<typeof respondSchema>
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = respondSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Giriş yapmalısın." };

  const { error } = await supabase
    .from("reservations")
    .update({ status: parsed.data.accept ? "accepted" : "rejected" })
    .eq("id", parsed.data.reservationId)
    .eq("seller_id", user.id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/rezervasyonlar");
  return { ok: true };
}
