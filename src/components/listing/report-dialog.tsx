"use client";
import { useState, useTransition } from "react";
import { Flag, AlertTriangle, ShieldAlert, ShieldOff, MoreHorizontal } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { reportAction } from "@/app/(app)/ilan/[id]/report-action";
import { toggleBlockAction } from "@/lib/actions/block";
import { cn } from "@/lib/utils";

interface Props {
  targetType: "listing" | "user";
  targetId: string;
  /** When reporting a listing, optionally allow blocking the seller in the same flow. */
  sellerId?: string;
  sellerName?: string;
  trigger?: React.ReactNode;
}

const REASONS = [
  { id: "spam", label: "Spam veya yanıltıcı", icon: AlertTriangle },
  { id: "scam", label: "Dolandırıcılık şüphesi", icon: ShieldAlert },
  { id: "inappropriate", label: "Uygunsuz içerik", icon: ShieldOff },
  { id: "other", label: "Diğer", icon: MoreHorizontal },
] as const;

export function ReportDialog({ targetType, targetId, sellerId, sellerName, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<(typeof REASONS)[number]["id"] | null>(null);
  const [details, setDetails] = useState("");
  const [alsoBlock, setAlsoBlock] = useState(false);
  const [pending, startTransition] = useTransition();
  const { toast } = useToast();

  function submit() {
    if (!reason) return;
    startTransition(async () => {
      const res = await reportAction({
        targetType,
        targetId,
        reason,
        details: details.trim() || undefined,
      });
      if (!res.ok) return toast(res.error, "error");

      if (alsoBlock && sellerId) {
        const blockRes = await toggleBlockAction({ userId: sellerId, block: true });
        if (!blockRes.ok) {
          toast(`Bildirim alındı, ancak engelleme başarısız: ${blockRes.error}`, "error");
        } else {
          toast(`Bildirimin alındı ve ${sellerName ?? "kullanıcı"} engellendi.`, "success");
        }
      } else {
        toast("Bildirimin alındı. Ekibimiz inceleyecek.", "success");
      }

      setOpen(false);
      setReason(null);
      setDetails("");
      setAlsoBlock(false);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-[12px] text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:text-foreground"
      >
        {trigger ?? (
          <>
            <Flag className="h-3.5 w-3.5" />
            {targetType === "listing" ? "Bu ilanı bildir" : "Bu kullanıcıyı bildir"}
          </>
        )}
      </button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={targetType === "listing" ? "İlanı bildir" : "Kullanıcıyı bildir"}
        description="Bildirimler gizli tutulur. Ekibimiz 24 saat içinde inceler."
      >
        <div className="flex flex-col gap-4">
          <ul className="flex flex-col gap-2">
            {REASONS.map((r) => {
              const active = reason === r.id;
              const Icon = r.icon;
              return (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => setReason(r.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-medium transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background hover:bg-muted"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {r.label}
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="report-details" className="text-[12px] font-medium text-muted-foreground">
              Ek bilgi (opsiyonel)
            </label>
            <textarea
              id="report-details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Detaylı bilgi vermek istersen..."
              className="resize-none rounded-2xl bg-muted px-4 py-3 text-[14px] outline-none transition focus:ring-2 focus:ring-ring"
            />
            <span className="self-end text-[10px] text-muted-foreground">
              {details.length}/500
            </span>
          </div>

          {sellerId && (
            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border p-3 active:bg-muted transition-colors">
              <input
                type="checkbox"
                checked={alsoBlock}
                onChange={(e) => setAlsoBlock(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-primary"
              />
              <div className="flex flex-col">
                <span className="text-sm font-medium">
                  {sellerName ?? "Satıcıyı"} engelle
                </span>
                <span className="text-[12px] text-muted-foreground">
                  Bu kişinin ilanlarını ve mesajlarını bir daha görmezsin.
                </span>
              </div>
            </label>
          )}

          <div className="flex gap-2">
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
              disabled={!reason || pending}
              onClick={submit}
            >
              {pending ? "Gönderiliyor…" : "Bildir"}
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
