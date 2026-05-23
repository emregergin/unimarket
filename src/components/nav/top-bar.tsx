"use client";
import { ArrowLeft, Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface TopBarProps {
  title: string;
  showBack?: boolean;
  showBell?: boolean;
  rightSlot?: React.ReactNode;
  transparent?: boolean;
}

export function TopBar({
  title,
  showBack,
  showBell,
  rightSlot,
  transparent,
}: TopBarProps) {
  const router = useRouter();
  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-14 items-center justify-between px-2 safe-top",
        transparent ? "bg-transparent" : "bg-background/85 backdrop-blur-md border-b border-border/60"
      )}
    >
      <div className="w-11">
        {showBack && (
          <button
            onClick={() => router.back()}
            aria-label="Geri"
            className="flex h-11 w-11 items-center justify-center rounded-full active:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
      </div>
      <h1 className="text-base font-semibold">{title}</h1>
      <div className="w-11 flex justify-end">
        {rightSlot ??
          (showBell && (
            <button
              aria-label="Bildirimler"
              className="flex h-11 w-11 items-center justify-center rounded-full active:bg-muted"
            >
              <Bell className="h-5 w-5" />
            </button>
          ))}
      </div>
    </header>
  );
}
