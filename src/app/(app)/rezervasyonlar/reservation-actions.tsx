"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Check, X, MessageCircle, PackageCheck, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { respondReservationAction } from "@/app/(app)/ilan/[id]/rezervasyon/actions";
import { completeReservationAction } from "./rating-actions";
import { RatingDialog } from "@/components/rating/rating-dialog";

interface Props {
  reservationId: string;
  status: "pending" | "accepted" | "rejected" | "cancelled" | "completed";
  viewerRole: "buyer" | "seller";
  chatId: string | null;
  counterpartyId: string;
  counterpartyName: string;
  alreadyRated?: boolean;
}

export function ReservationActions({
  reservationId,
  status,
  viewerRole,
  chatId,
  counterpartyId,
  counterpartyName,
  alreadyRated,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();

  // Pending + viewer is seller → accept/reject
  if (status === "pending" && viewerRole === "seller") {
    const respond = (accept: boolean) =>
      startTransition(async () => {
        const res = await respondReservationAction({ reservationId, accept });
        if (res.ok) {
          toast(accept ? "Rezervasyon onaylandı." : "Rezervasyon reddedildi.", "success");
          router.refresh();
        } else {
          toast(res.error, "error");
        }
      });
    return (
      <div className="flex gap-2">
        <Button
          size="md"
          variant="secondary"
          className="flex-1"
          disabled={pending}
          onClick={() => respond(false)}
        >
          <X className="h-4 w-4" /> Reddet
        </Button>
        <Button size="md" className="flex-1" disabled={pending} onClick={() => respond(true)}>
          <Check className="h-4 w-4" /> Onayla
        </Button>
      </div>
    );
  }

  // Accepted → chat + complete-handoff button
  if (status === "accepted") {
    const complete = () =>
      startTransition(async () => {
        const res = await completeReservationAction({ reservationId });
        if (res.ok) {
          toast("Buluşma tamamlandı olarak işaretlendi.", "success");
          router.refresh();
        } else {
          toast(res.error, "error");
        }
      });
    return (
      <div className="flex flex-col gap-2">
        {chatId && (
          <Link href={`/sohbet/${chatId}`}>
            <Button size="md" className="w-full">
              <MessageCircle className="h-4 w-4" />
              Sohbete Git
            </Button>
          </Link>
        )}
        <Button
          size="md"
          variant="secondary"
          className="w-full"
          disabled={pending}
          onClick={complete}
        >
          <PackageCheck className="h-4 w-4" />
          Buluşmayı Tamamla
        </Button>
      </div>
    );
  }

  // Completed → rate (unless already done)
  if (status === "completed" && !alreadyRated) {
    return (
      <RatingDialog
        reservationId={reservationId}
        rateeId={counterpartyId}
        rateeName={counterpartyName}
        trigger={
          <div className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-medium text-primary-foreground active:scale-[0.98] transition">
            <Star className="h-4 w-4" />
            {counterpartyName} kullanıcısını değerlendir
          </div>
        }
      />
    );
  }

  if (status === "completed" && alreadyRated) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-2xl bg-success-bg py-2.5 text-[12px] font-medium text-success">
        <Check className="h-3.5 w-3.5" />
        Değerlendirmen kaydedildi
      </div>
    );
  }

  return null;
}
