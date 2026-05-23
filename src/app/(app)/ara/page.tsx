import { Search } from "lucide-react";
import { TopBar } from "@/components/nav/top-bar";

export default function SearchPage() {
  return (
    <>
      <TopBar title="Ara" />
      <main className="flex flex-col items-center gap-3 px-5 pt-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Search className="h-7 w-7 text-muted-foreground" />
        </div>
        <h1 className="text-lg font-semibold">Gelişmiş arama yakında</h1>
        <p className="max-w-[260px] text-sm text-muted-foreground">
          MVP&apos;de arama keşfet sayfasından yapılabiliyor. Burada filtreler,
          kaydedilmiş aramalar ve şehir bazlı keşif olacak.
        </p>
      </main>
    </>
  );
}
