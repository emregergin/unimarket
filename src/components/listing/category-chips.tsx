"use client";
import { cn } from "@/lib/utils";

export interface Category {
  id: string;
  label: string;
}

interface Props {
  categories: Category[];
  activeId: string;
  onChange: (id: string) => void;
}

export function CategoryChips({ categories, activeId, onChange }: Props) {
  return (
    <div
      role="tablist"
      aria-label="Kategoriler"
      className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-1"
    >
      {categories.map((c) => {
        const active = c.id === activeId;
        return (
          <button
            key={c.id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(c.id)}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              active
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-foreground hover:opacity-80"
            )}
          >
            {c.label}
          </button>
        );
      })}
    </div>
  );
}
