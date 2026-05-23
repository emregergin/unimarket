import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-full bg-muted text-muted-foreground">
        <Compass className="h-7 w-7" />
      </div>
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold tracking-tight">Sayfa bulunamadı</h1>
        <p className="max-w-[280px] text-[13px] text-muted-foreground">
          Aradığın sayfa kaldırılmış veya hiç var olmamış olabilir.
        </p>
      </div>
      <Link
        href="/kesfet"
        className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground active:scale-95 transition"
      >
        Ana Sayfaya Dön
      </Link>
    </main>
  );
}
