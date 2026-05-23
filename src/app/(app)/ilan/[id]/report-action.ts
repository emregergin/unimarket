"use server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  targetType: z.enum(["listing", "user"]),
  targetId: z.string().uuid(),
  reason: z.enum(["spam", "scam", "inappropriate", "other"]),
  details: z.string().trim().max(500).optional(),
});

export async function reportAction(
  raw: z.infer<typeof schema>
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Giriş yapmalısın." };

  const { error } = await supabase.from("reports").insert({
    reporter_id: user.id,
    target_type: parsed.data.targetType,
    target_id: parsed.data.targetId,
    reason: parsed.data.reason,
    details: parsed.data.details ?? null,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
