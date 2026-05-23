"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  userId: z.string().uuid(),
  block: z.boolean(),
});

export async function toggleBlockAction(
  raw: z.infer<typeof schema>
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Geçersiz istek." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Giriş yapmalısın." };
  if (user.id === parsed.data.userId)
    return { ok: false, error: "Kendini engelleyemezsin." };

  if (parsed.data.block) {
    const { error } = await supabase
      .from("blocks")
      .upsert({ blocker_id: user.id, blocked_id: parsed.data.userId });
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await supabase
      .from("blocks")
      .delete()
      .eq("blocker_id", user.id)
      .eq("blocked_id", parsed.data.userId);
    if (error) return { ok: false, error: error.message };
  }

  revalidatePath("/kesfet");
  revalidatePath("/profil/engellenenler");
  return { ok: true };
}
