"use client";
import { useState, useTransition } from "react";
import { Star } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { submitRatingAction } from "@/app/(app)/rezervasyonlar/rating-actions";

interface Props {
  reservationId: string;
  rateeId: string;
  rateeName: string;
  trigger: React.ReactNode;
}

export function RatingDialog({ reservationId, rateeId, rateeName, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [stars, setStars] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();

  const display = hover || stars;
  const labels = ["", "Kötü", "İdare eder", "İyi", "Çok iyi", "Mükemmel"];

  function submit() {
    if (stars === 0) return;
    startTransition(async () => {
      const res = await submitRatingAction({
        reservationId,
        rateeId,
        stars,
        comment: comment.trim() || undefined,
      });
      if (res.ok) {
        toast("Değerlendirmen için teşekkürler!", "success");
        setOpen(false);
        setStars(0);
        setComment("");
      } else {
        toast(res.error, "error");
      }
    });
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="w-full">
        {trigger}
      </button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={`${rateeName} kullanıcısını değerlendir`}
        description="Deneyimini paylaşmak topluluğu güvende tutar."
      >
        <div className="flex flex-col items-center gap-5 py-2">
          <div
            role="radiogroup"
            aria-label="Yıldız değerlendirmesi"
            className="flex items-center gap-1"
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={stars === n}
                aria-label={`${n} yıldız`}
                onMouseEnter={() => setHover(n)}
                onMouseLeave={() => setHover(0)}
                onFocus={() => setHover(n)}
                onBlur={() => setHover(0)}
                onClick={() => setStars(n)}
                className="p-1 transition-transform active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full"
              >
                <Star
                  className={cn(
                    "h-9 w-9 transition-colors",
                    display >= n
                      ? "fill-amber-400 stroke-amber-400"
                      : "stroke-muted-foreground"
                  )}
                />
              </button>
            ))}
          </div>
          <p
            className={cn(
              "text-sm font-medium transition-colors",
              display === 0 ? "text-muted-foreground" : "text-foreground"
            )}
          >
            {labels[display] || "Yıldızı seç"}
          </p>

          <div className="flex w-full flex-col gap-1.5">
            <label htmlFor="rating-comment" className="text-[12px] font-medium text-muted-foreground">
              Yorum (opsiyonel)
            </label>
            <textarea
              id="rating-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Buluşma nasıl geçti?"
              className="resize-none rounded-2xl bg-muted px-4 py-3 text-[14px] outline-none transition focus:ring-2 focus:ring-ring"
            />
            <span className="self-end text-[10px] text-muted-foreground">{comment.length}/500</span>
          </div>

          <div className="flex w-full gap-2">
            <Button
              variant="secondary"
              size="md"
              className="flex-1"
              onClick={() => setOpen(false)}
            >
              İptal
            </Button>
            <Button
              size="md"
              className="flex-1"
              disabled={stars === 0 || pending}
              onClick={submit}
            >
              {pending ? "Gönderiliyor…" : "Gönder"}
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
