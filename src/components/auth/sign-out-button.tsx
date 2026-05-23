"use client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { signOutAction } from "@/app/(auth)/actions";

export function SignOutButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <button
      onClick={() =>
        startTransition(async () => {
          await signOutAction();
          router.replace("/");
          router.refresh();
        })
      }
      disabled={pending}
      className="flex items-center gap-2 self-start rounded-full bg-muted px-4 py-2 text-sm text-muted-foreground active:scale-95 transition disabled:opacity-50"
    >
      <LogOut className="h-4 w-4" />
      {pending ? "Çıkış yapılıyor…" : "Çıkış Yap"}
    </button>
  );
}
