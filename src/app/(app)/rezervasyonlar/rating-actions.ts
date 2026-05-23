"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const completeSchema = z.object({ reservationId: z.string().uuid() });

/**
 * Either participant can mark a reservation 'completed' once the handoff has happened.
 * This unlocks the rating UI on both sides.
 */
export async function completeReservationAction(
  raw: z.infer<typeof completeSchema>
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = completeSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Giriş yapmalısın." };

  // Update is gated by RLS: only participants can update.
  const { error } = await supabase
    .from("reservations")
    .update({ status: "completed" })
    .eq("id", parsed.data.reservationId)
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .eq("status", "accepted");

  if (error) return { ok: false, error: error.message };
  revalidatePath("/rezervasyonlar");
  return { ok: true };
}

const rateSchema = z.object({
  reservationId: z.string().uuid(),
  rateeId: z.string().uuid(),
  stars: z.number().int().min(1).max(5),
  comment: z.string().trim().max(500).optional(),
});

export async function submitRatingAction(
  raw: z.infer<typeof rateSchema>
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = rateSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Giriş yapmalısın." };

  const { error } = await supabase.from("ratings").insert({
    reservation_id: parsed.data.reservationId,
    rater_id: user.id,
    ratee_id: parsed.data.rateeId,
    stars: parsed.data.stars,
    comment: parsed.data.comment ?? null,
  });
  if (error) {
    if (error.code === "23505") return { ok: false, error: "Bu rezervasyon için zaten değerlendirme yaptın." };
    return { ok: false, error: error.message };
  }
  revalidatePath("/rezervasyonlar");
  return { ok: true };
}
