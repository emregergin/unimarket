"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export interface UseUserState {
  user: User | null;
  verifiedStudent: boolean;
  university: string | null;
  loading: boolean;
}

/**
 * Client-side reactive user hook. Re-renders on sign-in / sign-out / token refresh.
 * Intentionally minimal — for richer profile data, prefer the server helper.
 */
export function useUser(): UseUserState {
  const [state, setState] = useState<UseUserState>({
    user: null,
    verifiedStudent: false,
    university: null,
    loading: true,
  });

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    async function load(user: User | null) {
      if (!user) {
        if (mounted)
          setState({ user: null, verifiedStudent: false, university: null, loading: false });
        return;
      }
      const { data: profile } = await supabase
        .from("users")
        .select("verified_student, university")
        .eq("id", user.id)
        .maybeSingle();
      if (mounted)
        setState({
          user,
          verifiedStudent: profile?.verified_student ?? false,
          university: profile?.university ?? null,
          loading: false,
        });
    }

    supabase.auth.getUser().then(({ data }) => load(data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      load(session?.user ?? null);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}
