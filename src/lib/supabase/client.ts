"use client";
import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client.
 * Use inside "use client" components / hooks.
 * Reads/writes cookies via document.cookie.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
