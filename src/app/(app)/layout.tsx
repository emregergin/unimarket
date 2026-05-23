import { redirect } from "next/navigation";
import { BottomNav } from "@/components/nav/bottom-nav";
import { getCurrentUser } from "@/lib/auth/get-current-user";

/**
 * Server-side guard #2 (after middleware). If somehow the middleware was
 * bypassed (edge cache, race condition), we still redirect here.
 *
 * Note: when NEXT_PUBLIC_SUPABASE_URL isn't configured (e.g. local UI
 * preview without backend), getCurrentUser() returns null silently —
 * we let the user through in that case so the design can be reviewed.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const hasBackend = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (hasBackend) {
    const me = await getCurrentUser();
    if (!me) redirect("/giris");
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {children}
      <BottomNav />
    </div>
  );
}
