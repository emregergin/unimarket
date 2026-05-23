"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createReservationAction } from "./actions";

export function ReserveForm({ listingId }: { listingId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await createReservationAction({ listingId, message: message.trim() || undefined });
      if (!res.ok) return setError(res.error);
      router.replace(`/rezervasyonlar?new=${res.reservationId}`);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={4}
        placeholder="Merhaba! İlanınla ilgileniyorum, hafta sonu teslim alabilir miyim?"
        maxLength={500}
        className="resize-none rounded-2xl bg-muted px-4 py-3 text-[15px] outline-none transition focus:ring-2 focus:ring-ring"
      />
      <div className="flex justify-end text-[11px] text-muted-foreground">{message.length}/500</div>
      {error && (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-3 text-[13px] text-destructive">
          {error}
        </div>
      )}
      <Button size="lg" onClick={submit} disabled={pending}>
        <Send className="h-4 w-4" />
        {pending ? "Gönderiliyor…" : "Rezervasyon İsteği Gönder"}
      </Button>
    </div>
  );
}
