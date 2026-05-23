import Image from "next/image";
import Link from "next/link";
import {
  ShieldCheck,
  Star,
  Settings,
  Package,
  Inbox,
  MessageCircle,
  ChevronRight,
  AlertCircle,
  ShieldOff,
} from "lucide-react";
import { TopBar } from "@/components/nav/top-bar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SELLER } from "@/lib/mock-data";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { SignOutButton } from "@/components/auth/sign-out-button";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const me = await getCurrentUser();
  const display = me
    ? {
        name: me.profile.full_name ?? me.profile.email.split("@")[0],
        email: me.profile.email,
        university: me.profile.university ?? "Üniversite belirtilmemiş",
        avatar: me.profile.avatar_url ?? SELLER.avatar,
        verified: me.profile.verified_student,
        rating: Number(me.profile.rating_avg) || 0,
        ratingCount: me.profile.rating_count,
      }
    : { ...SELLER, email: "demo@boun.edu.tr" };

  return (
    <>
      <TopBar
        title="Profil"
        rightSlot={
          <button className="flex h-11 w-11 items-center justify-center rounded-full active:bg-muted">
            <Settings className="h-5 w-5" />
          </button>
        }
      />
      <main className="flex flex-col gap-5 px-5 pt-2">
        <Card className="flex flex-col items-center gap-3 text-center">
          <div className="relative h-20 w-20 overflow-hidden rounded-full">
            <Image src={display.avatar} alt={display.name} fill sizes="80px" className="object-cover" />
          </div>
          <div className="flex flex-col items-center gap-1">
            <p className="text-lg font-semibold">{display.name}</p>
            {display.verified ? (
              <Badge variant="info" size="sm">
                <ShieldCheck className="h-3 w-3" /> Doğrulanmış Öğrenci
              </Badge>
            ) : (
              <Badge variant="neutral" size="sm">
                <AlertCircle className="h-3 w-3" /> Doğrulama Bekleniyor
              </Badge>
            )}
            <p className="text-[12px] text-muted-foreground">{display.university}</p>
            <p className="text-[11px] text-muted-foreground">{display.email}</p>
          </div>
          {display.ratingCount > 0 && (
            <div className="flex items-center gap-1.5 text-sm">
              <Star className="h-4 w-4 fill-foreground text-foreground" />
              <span className="font-semibold">{display.rating.toFixed(1)}</span>
              <span className="text-muted-foreground">({display.ratingCount})</span>
            </div>
          )}
        </Card>

        {!display.verified && (
          <Link
            href="/dogrulama"
            className="flex items-center gap-3 rounded-2xl border border-success/40 bg-success-bg p-4 text-success active:scale-[0.99] transition"
          >
            <ShieldCheck className="h-5 w-5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold">Öğrenci doğrulamasını tamamla</p>
              <p className="text-[12px] opacity-80">Rezervasyon yapmak için doğrulama gerekli.</p>
            </div>
            <ChevronRight className="h-4 w-4" />
          </Link>
        )}

        <nav className="flex flex-col overflow-hidden rounded-2xl border border-border">
          <Row icon={<Package className="h-4 w-4" />} label="İlanlarım" href="/profil/ilanlar" />
          <Row icon={<Inbox className="h-4 w-4" />} label="Rezervasyonlar" href="/rezervasyonlar" />
          <Row icon={<MessageCircle className="h-4 w-4" />} label="Sohbetler" href="/sohbet" />
          <Row icon={<ShieldOff className="h-4 w-4" />} label="Engellenen Kullanıcılar" href="/profil/engellenenler" />
        </nav>

        <SignOutButton />
      </main>
    </>
  );
}

function Row({ icon, label, href }: { icon: React.ReactNode; label: string; href: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 border-b border-border bg-background px-4 py-4 last:border-b-0 active:bg-muted transition-colors"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">{icon}</span>
      <span className="flex-1 text-sm font-medium">{label}</span>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}
