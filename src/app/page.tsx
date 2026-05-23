import Link from "next/link";
import { ShieldCheck, Sparkles, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";

export default function OnboardingPage() {
  return (
    <main className="flex min-h-screen flex-col bg-background px-5 pt-4 safe-top">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground text-sm font-bold">
            U
          </div>
          <span className="text-base font-semibold tracking-tight">UniMarket</span>
        </div>
        <ThemeToggle />
      </header>

      {/* Hero illustration card */}
      <section className="relative mt-6 overflow-hidden rounded-3xl bg-muted p-6 aspect-[4/5]">
        <div className="absolute inset-0">
          {/* Stylized SVG illustration — works offline, matches minimal aesthetic */}
          <svg viewBox="0 0 320 400" className="h-full w-full">
            <defs>
              <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--accent-success-bg))" />
                <stop offset="100%" stopColor="hsl(var(--muted))" />
              </linearGradient>
            </defs>
            <rect width="320" height="400" fill="url(#g1)" />
            {/* Stack of items */}
            <rect x="60" y="240" width="200" height="90" rx="14" fill="hsl(var(--background))" />
            <rect x="80" y="170" width="160" height="70" rx="12" fill="hsl(var(--background))" opacity="0.9" />
            <rect x="100" y="110" width="120" height="60" rx="10" fill="hsl(var(--background))" opacity="0.8" />
            {/* Tag */}
            <circle cx="240" cy="140" r="28" fill="hsl(var(--accent-success))" />
            <text
              x="240"
              y="146"
              fontSize="16"
              fontWeight="700"
              textAnchor="middle"
              fill="white"
            >
              ₺
            </text>
            {/* Sparkles */}
            <circle cx="70" cy="90" r="3" fill="hsl(var(--accent-info))" />
            <circle cx="280" cy="220" r="4" fill="hsl(var(--accent-success))" />
            <circle cx="50" cy="320" r="3" fill="hsl(var(--accent-info))" />
          </svg>
        </div>
        <Badge variant="success" className="relative">
          <Leaf className="h-3 w-3" /> Sürdürülebilir Öğrenci Ekonomisi
        </Badge>
      </section>

      <section className="mt-8 flex flex-col gap-3">
        <h1 className="text-[28px] font-bold leading-tight tracking-tight">
          Öğrenciler için
          <br />
          güvenli pazaryeri
        </h1>
        <p className="text-[15px] leading-relaxed text-muted-foreground">
          Sadece doğrulanmış üniversite öğrencileri alışveriş yapabilir.
          Ücretsiz ve uygun fiyatlı ürünler, güvenle elden teslim.
        </p>
      </section>

      <ul className="mt-6 grid grid-cols-3 gap-3">
        <FeaturePill icon={<ShieldCheck className="h-4 w-4" />} label="Güvenli" />
        <FeaturePill icon={<Sparkles className="h-4 w-4" />} label="Minimal" />
        <FeaturePill icon={<Leaf className="h-4 w-4" />} label="Sürdürülebilir" />
      </ul>

      <div className="mt-auto flex flex-col gap-3 pb-8 pt-10">
        <Link href="/kayit">
          <Button size="lg" className="w-full">
            Hesap Oluştur
          </Button>
        </Link>
        <Link href="/giris">
          <Button size="lg" variant="secondary" className="w-full">
            Giriş Yap
          </Button>
        </Link>
        <p className="text-center text-[11px] text-muted-foreground">
          Devam ederek{" "}
          <span className="underline">Kullanım Koşulları</span>nı kabul edersin.
        </p>
      </div>
    </main>
  );
}

function FeaturePill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <li className="flex flex-col items-center gap-1.5 rounded-2xl bg-muted/60 py-3 text-center">
      <span className="text-foreground">{icon}</span>
      <span className="text-[12px] font-medium">{label}</span>
    </li>
  );
}
