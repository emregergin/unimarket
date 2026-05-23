"use client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useToast } from "@/components/ui/toast";
import { toggleBlockAction } from "@/lib/actions/block";

export function UnblockButton({ userId }: { userId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();
  return (
    <button
      onClick={() =>
        startTransition(async () => {
          const res = await toggleBlockAction({ userId, block: false });
          if (res.ok) {
            toast("Engel kaldırıldı.", "success");
            router.refresh();
          } else {
            toast(res.error, "error");
          }
        })
      }
      disabled={pending}
      className="rounded-full bg-muted px-3 py-1.5 text-[12px] font-medium text-foreground active:scale-95 transition disabled:opacity-50"
    >
      {pending ? "Kaldırılıyor…" : "Engeli Kaldır"}
    </button>
  );
}
