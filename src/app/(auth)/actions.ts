"use server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isUniversityEmail, lookupUniversity } from "@/lib/auth/university-domains";

const emailSchema = z.string().trim().toLowerCase().email("Geçerli bir e-posta gir.");

export type ActionResult =
  | { ok: true; message?: string }
  | { ok: false; error: string };

/**
 * Sends a 6-digit OTP to the given email.
 * Supabase calls this "shouldCreateUser: true" so the same flow handles
 * both first-time signup and returning login — no separate paths needed.
 */
export async function sendOtpAction(formData: FormData): Promise<ActionResult> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const email = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true },
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true, message: "Doğrulama kodu e-postana gönderildi." };
}

const verifySchema = z.object({
  email: emailSchema,
  token: z.string().trim().regex(/^\d{6}$/, "6 haneli kodu gir."),
});

/**
 * Verifies the OTP. On success:
 *  - Supabase sets the auth cookies
 *  - Our trigger flips verified_student=true if the email is on the .edu.tr allowlist
 *  - As a safety net, we also bootstrap the public.users row here in case the trigger
 *    hasn't run (e.g. when applying to existing projects).
 */
export async function verifyOtpAction(formData: FormData): Promise<ActionResult> {
  const parsed = verifySchema.safeParse({
    email: formData.get("email"),
    token: formData.get("token"),
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { email, token } = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });
  if (error || !data.user) return { ok: false, error: error?.message ?? "Doğrulama başarısız." };

  // Application-side safety net: ensure the public.users row exists & is verified
  // if the email domain is in our allowlist. The DB trigger is the primary path.
  const uni = lookupUniversity(email);
  const verified = isUniversityEmail(email);

  const { error: upsertError } = await supabase
    .from("users")
    .upsert(
      {
        id: data.user.id,
        email,
        university: uni?.name ?? null,
        verified_student: verified,
      },
      { onConflict: "id" }
    );

  if (upsertError) {
    // Non-fatal — auth succeeded; trigger likely already did its work.
    console.warn("[verifyOtpAction] upsert warning:", upsertError.message);
  }

  return { ok: true };
}

export async function signOutAction(): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
