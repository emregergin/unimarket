"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  listingId: z.string().uuid(),
  favorite: z.boolean(),
});

export async function toggleFavoriteAction(
  raw: z.infer<typeof schema>
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Geçersiz istek." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Giriş yapmalısın." };

  if (parsed.data.favorite) {
    const { error } = await supabase
      .from("favorites")
      .upsert({ user_id: user.id, listing_id: parsed.data.listingId });
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("user_id", user.id)
      .eq("listing_id", parsed.data.listingId);
    if (error) return { ok: false, error: error.message };
  }

  revalidatePath("/favoriler");
  return { ok: true };
}
