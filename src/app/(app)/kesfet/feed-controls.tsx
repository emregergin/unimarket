"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { CategoryChips, type Category } from "@/components/listing/category-chips";

interface Props {
  categories: Category[];
  activeCategory: string;
  initialSearch: string;
}

export function FeedControls({ categories, activeCategory, initialSearch }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [search, setSearch] = useState(initialSearch);
  const [, startTransition] = useTransition();

  function updateUrl(next: { category?: string; q?: string }) {
    const sp = new URLSearchParams(params.toString());
    if (next.category !== undefined) {
      if (next.category === "all") sp.delete("category");
      else sp.set("category", next.category);
    }
    if (next.q !== undefined) {
      if (!next.q) sp.delete("q");
      else sp.set("q", next.q);
    }
    startTransition(() => router.replace(`/kesfet${sp.toString() ? `?${sp}` : ""}`));
  }

  return (
    <>
      <div className="px-5 pt-2">
        <Input
          placeholder="Kitap, mobilya, elektronik ara…"
          leftIcon={<Search className="h-4 w-4" />}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            // Debounce-ish: update URL after 350ms of inactivity
            clearTimeout((updateUrl as unknown as { _t?: number })._t);
            (updateUrl as unknown as { _t?: number })._t = window.setTimeout(
              () => updateUrl({ q: e.target.value }),
              350
            ) as unknown as number;
          }}
          rightSlot={
            <button
              aria-label="Filtrele"
              className="flex h-8 w-8 items-center justify-center rounded-full text-foreground"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </button>
          }
        />
      </div>
      <div className="mt-3 pb-2">
        <CategoryChips
          categories={categories}
          activeId={activeCategory}
          onChange={(id) => updateUrl({ category: id })}
        />
      </div>
    </>
  );
}
