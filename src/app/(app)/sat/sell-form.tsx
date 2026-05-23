"use client";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import {
  ImagePlus,
  X,
  ArrowRight,
  MapPin,
  Tag,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import {
  CATEGORY_VALUES,
  CONDITION_VALUES,
  CATEGORY_LABELS,
  CONDITION_LABELS,
} from "@/lib/validators/listing";
import { createListingAction, getSignedUploadUrlsAction } from "./actions";

interface LocalImage {
  id: string;
  file: File;
  previewUrl: string;
  uploadedPath?: string;
  uploading?: boolean;
  error?: string;
}

export function SellForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [images, setImages] = useState<LocalImage[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORY_VALUES)[number]>("furniture");
  const [condition, setCondition] = useState<(typeof CONDITION_VALUES)[number]>("good");
  const [isFree, setIsFree] = useState(false);
  const [priceTL, setPriceTL] = useState(""); // displayed in lira, converted to kuruş on submit
  const [city, setCity] = useState("");
  const [pickupLocation, setPickupLocation] = useState("");
  const [globalError, setGlobalError] = useState<string | null>(null);

  const canSubmit =
    images.length > 0 &&
    images.every((i) => i.uploadedPath) &&
    title.trim().length >= 3 &&
    description.trim().length >= 10 &&
    city.trim().length >= 2 &&
    (isFree || Number(priceTL) > 0);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const supabase = createClient();
    const incoming = Array.from(files).slice(0, 8 - images.length);
    const newOnes: LocalImage[] = incoming.map((file) => ({
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
      uploading: true,
    }));
    setImages((prev) => [...prev, ...newOnes]);

    const res = await getSignedUploadUrlsAction(newOnes.length);
    if (!res.ok) {
      setImages((prev) =>
        prev.map((img) =>
          newOnes.find((n) => n.id === img.id) ? { ...img, uploading: false, error: res.error } : img
        )
      );
      return;
    }

    await Promise.all(
      newOnes.map(async (img, idx) => {
        const upload = res.uploads[idx];
        const { error } = await supabase.storage
          .from("listings")
          .uploadToSignedUrl(upload.path, upload.token, img.file, {
            contentType: img.file.type,
            upsert: false,
          });
        setImages((prev) =>
          prev.map((p) =>
            p.id === img.id
              ? error
                ? { ...p, uploading: false, error: error.message }
                : { ...p, uploading: false, uploadedPath: upload.path }
              : p
          )
        );
      })
    );
  }

  function removeImage(id: string) {
    setImages((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  }

  function onSubmit() {
    setGlobalError(null);
    const priceKurus = isFree ? 0 : Math.round(Number(priceTL) * 100);
    startTransition(async () => {
      const res = await createListingAction({
        title: title.trim(),
        description: description.trim(),
        category,
        condition,
        isFree,
        price: priceKurus,
        city: city.trim(),
        pickupLocation: pickupLocation.trim() || null,
        images: images.map((i) => i.uploadedPath!).filter(Boolean),
      });
      if (!res.ok) return setGlobalError(res.error);
      router.replace(`/ilan/${res.id}`);
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="flex flex-col gap-6 px-5 pb-32 pt-2"
    >
      {/* Images */}
      <section className="flex flex-col gap-2">
        <SectionTitle title="Fotoğraflar" hint="En fazla 8 fotoğraf. İlk fotoğraf kapak olur." />
        <div className="grid grid-cols-4 gap-2">
          {images.map((img) => (
            <div
              key={img.id}
              className="relative aspect-square overflow-hidden rounded-2xl bg-muted"
            >
              <Image
                src={img.previewUrl}
                alt=""
                fill
                sizes="80px"
                className="object-cover"
                unoptimized
              />
              {img.uploading && (
                <div className="absolute inset-0 grid place-items-center bg-background/60 backdrop-blur-sm">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
                </div>
              )}
              {img.uploadedPath && !img.uploading && (
                <div className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-success text-white">
                  <CheckCircle2 className="h-3 w-3" />
                </div>
              )}
              <button
                type="button"
                onClick={() => removeImage(img.id)}
                className="absolute left-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-background/90 active:scale-95"
                aria-label="Kaldır"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {images.length < 8 && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex aspect-square flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-border bg-muted/40 text-muted-foreground active:scale-95 transition"
            >
              <ImagePlus className="h-5 w-5" />
              <span className="text-[10px] font-medium">Ekle</span>
            </button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => handleFiles(e.target.files)}
        />
      </section>

      {/* Title & description */}
      <section className="flex flex-col gap-3">
        <SectionTitle title="İlan başlığı" />
        <Input
          placeholder="ör. Minimalist Meşe Çalışma Masası"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          placeholder="Ürünü kısaca anlat: yaşı, durumu, taşıma detayları…"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          className="resize-none rounded-2xl bg-muted px-4 py-3 text-[15px] outline-none transition focus:ring-2 focus:ring-ring"
        />
      </section>

      {/* Price toggle */}
      <section className="flex flex-col gap-3">
        <SectionTitle title="Fiyat" />
        <div className="flex gap-2">
          <ToggleChip active={!isFree} onClick={() => setIsFree(false)} icon={<Tag className="h-3.5 w-3.5" />}>
            Satılık
          </ToggleChip>
          <ToggleChip active={isFree} onClick={() => setIsFree(true)} icon={<Sparkles className="h-3.5 w-3.5" />}>
            Ücretsiz
          </ToggleChip>
        </div>
        {!isFree && (
          <Input
            type="number"
            inputMode="decimal"
            placeholder="0"
            value={priceTL}
            onChange={(e) => setPriceTL(e.target.value)}
            leftIcon={<span className="text-sm font-semibold">₺</span>}
            rightSlot={<span className="text-[11px] text-muted-foreground">TRY</span>}
          />
        )}
        {isFree && (
          <p className="rounded-2xl bg-success-bg p-3 text-[13px] text-success">
            <Sparkles className="mr-1 inline h-3 w-3" />
            Harika! Ücretsiz ilanlar feed&apos;de öne çıkar ve sürdürülebilir öğrenci ekonomisine katkı sağlar.
          </p>
        )}
      </section>

      {/* Category */}
      <section className="flex flex-col gap-3">
        <SectionTitle title="Kategori" />
        <div className="flex flex-wrap gap-2">
          {CATEGORY_VALUES.map((c) => (
            <ToggleChip key={c} active={category === c} onClick={() => setCategory(c)}>
              {CATEGORY_LABELS[c]}
            </ToggleChip>
          ))}
        </div>
      </section>

      {/* Condition */}
      <section className="flex flex-col gap-3">
        <SectionTitle title="Durum" />
        <div className="flex flex-wrap gap-2">
          {CONDITION_VALUES.map((c) => (
            <ToggleChip key={c} active={condition === c} onClick={() => setCondition(c)}>
              {CONDITION_LABELS[c]}
            </ToggleChip>
          ))}
        </div>
      </section>

      {/* Location */}
      <section className="flex flex-col gap-3">
        <SectionTitle title="Teslim yeri" hint="Sadece şehir herkese görünür. Tam adres yalnızca rezervasyon onaylanınca paylaşılır." />
        <Input
          placeholder="Şehir (ör. İstanbul)"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          leftIcon={<MapPin className="h-4 w-4" />}
        />
        <Input
          placeholder="Buluşma noktası (ör. Kuzey Kampüs Köyü)"
          value={pickupLocation}
          onChange={(e) => setPickupLocation(e.target.value)}
        />
      </section>

      {globalError && (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-3 text-[13px] text-destructive">
          {globalError}
        </div>
      )}

      {/* Sticky submit */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 backdrop-blur-md shadow-sticky safe-bottom">
        <div className="mx-auto flex max-w-md items-center gap-3 px-4 py-3">
          {!isFree && Number(priceTL) > 0 && (
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Fiyat</span>
              <span className="text-base font-bold">
                ₺{Number(priceTL).toLocaleString("tr-TR")}
              </span>
            </div>
          )}
          {isFree && <Badge variant="success">ÜCRETSİZ</Badge>}
          <Button size="lg" type="submit" className="flex-1" disabled={!canSubmit || pending}>
            {pending ? "Yayınlanıyor…" : "İlanı Yayınla"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </form>
  );
}

function SectionTitle({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-col">
      <h2 className="text-[17px] font-semibold tracking-tight">{title}</h2>
      {hint && <p className="text-[12px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function ToggleChip({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
        active ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
      )}
    >
      {icon}
      {children}
    </button>
  );
}
