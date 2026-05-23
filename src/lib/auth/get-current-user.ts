import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

export interface CurrentUser {
  auth: User;
  profile: {
    id: string;
    email: string;
    full_name: string | null;
    university: string | null;
    department: string | null;
    avatar_url: string | null;
    verified_student: boolean;
    rating_avg: number;
    rating_count: number;
  };
}

/**
 * Server-side helper. Returns null if not signed in or profile not bootstrapped yet.
 * Use inside Server Components, Route Handlers, and Server Actions.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select(
      "id, email, full_name, university, department, avatar_url, verified_student, rating_avg, rating_count"
    )
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) return null;
  return { auth: user, profile };
}

/** Throws-if-missing variant for protected actions. */
export async function requireVerifiedUser(): Promise<CurrentUser> {
  const me = await getCurrentUser();
  if (!me) throw new Error("UNAUTHENTICATED");
  if (!me.profile.verified_student) throw new Error("NOT_VERIFIED");
  return me;
}
