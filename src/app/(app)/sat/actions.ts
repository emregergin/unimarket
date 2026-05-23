"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireVerifiedUser } from "@/lib/auth/get-current-user";
import { createListingSchema, type CreateListingInput } from "@/lib/validators/listing";

export type CreateListingResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

/**
 * Creates a listing. Anyone signed in can sell — verification is only required
 * to buy/reserve. We still require sign-in (requireVerifiedUser checks both,
 * but for sellers we relax to just signed-in).
 *
 * Images: client uploads to Supabase Storage first, then sends paths here.
 */
export async function createListingAction(
  input: CreateListingInput
): Promise<CreateListingResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Giriş yapmalısın." };

  const parsed = createListingSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }
  const data = parsed.data;

  // Enforce free/price coupling
  const price = data.isFree ? 0 : data.price;

  const { data: row, error } = await supabase
    .from("listings")
    .insert({
      seller_id: user.id,
      title: data.title,
      description: data.description,
      category: data.category,
      condition: data.condition,
      price,
      is_free: data.isFree,
      images: data.images,
      city: data.city,
      pickup_location: data.pickupLocation ?? null,
      status: "active",
    })
    .select("id")
    .single();

  if (error || !row) {
    // Friendly mapping for known Postgres errors
    const raw = error?.message ?? "";
    if (raw.includes("rate_limit_exceeded")) {
      return {
        ok: false,
        error: "Son 24 saatte en fazla 5 ilan oluşturabilirsin. Lütfen yarın tekrar dene.",
      };
    }
    return { ok: false, error: error?.message ?? "İlan oluşturulamadı." };
  }

  revalidatePath("/kesfet");
  return { ok: true, id: row.id };
}

/**
 * Returns a list of signed Storage upload URLs the client can PUT directly to.
 * Avoids streaming bytes through our Server Actions.
 */
export async function getSignedUploadUrlsAction(
  fileCount: number
): Promise<{ ok: true; uploads: { path: string; token: string }[] } | { ok: false; error: string }> {
  if (fileCount < 1 || fileCount > 8) return { ok: false, error: "Geçersiz dosya sayısı." };

  const me = await requireVerifiedUser().catch(async () => {
    // Allow non-verified sellers; we just need a session.
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    return { auth: user } as { auth: { id: string } };
  });
  if (!me) return { ok: false, error: "Giriş yapmalısın." };

  const supabase = await createClient();
  const uploads: { path: string; token: string }[] = [];
  for (let i = 0; i < fileCount; i++) {
    const path = `${me.auth.id}/${crypto.randomUUID()}.jpg`;
    const { data, error } = await supabase.storage
      .from("listings")
      .createSignedUploadUrl(path);
    if (error || !data) return { ok: false, error: error?.message ?? "Yükleme hazırlanamadı." };
    uploads.push({ path: data.path, token: data.token });
  }
  return { ok: true, uploads };
}
