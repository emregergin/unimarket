import Image from "next/image";
import { ShieldOff } from "lucide-react";
import { TopBar } from "@/components/nav/top-bar";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { SELLER } from "@/lib/mock-data";
import { UnblockButton } from "./unblock-button";

export const dynamic = "force-dynamic";

interface BlockedRow {
  blocked_id: string;
  blocked: { id: string; full_name: string | null; university: string | null; avatar_url: string | null };
}

export default async function BlockedUsersPage() {
  const me = await getCurrentUser();
  if (!me) {
    return (
      <>
        <TopBar title="Engellenen Kullanıcılar" showBack />
        <main className="px-5 pt-2">
          <p className="text-sm text-muted-foreground">Lütfen giriş yap.</p>
        </main>
      </>
    );
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("blocks")
    .select(
      `blocked_id,
       blocked:users!blocks_blocked_id_fkey(id, full_name, university, avatar_url)`
    )
    .eq("blocker_id", me.auth.id);

  const rows = ((data ?? []) as unknown as BlockedRow[]).map((r) => ({
    id: r.blocked_id,
    user: Array.isArray(r.blocked) ? r.blocked[0] : r.blocked,
  }));

  return (
    <>
      <TopBar title="Engellenen Kullanıcılar" showBack />
      <main className="flex flex-col gap-3 px-5 pt-2">
        {rows.length === 0 ? (
          <EmptyState
            icon={<ShieldOff className="h-6 w-6" />}
            title="Engellenen kimse yok"
            description="Birini engellediğinde burada görünür ve istediğin zaman geri alabilirsin."
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {rows.map((r) => (
              <li key={r.id}>
                <Card className="flex items-center gap-3 !p-3">
                  <div className="relative h-10 w-10 overflow-hidden rounded-full bg-background">
                    <Image
                      src={r.user?.avatar_url ?? SELLER.avatar}
                      alt=""
                      fill
                      sizes="40px"
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <p className="truncate text-sm font-semibold">
                      {r.user?.full_name ?? "Kullanıcı"}
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {r.user?.university ?? "—"}
                    </p>
                  </div>
                  <UnblockButton userId={r.id} />
                </Card>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
