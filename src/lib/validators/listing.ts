import { z } from "zod";

export const CATEGORY_VALUES = [
  "electronics",
  "furniture",
  "books",
  "dorm",
  "kitchen",
  "clothing",
  "transport",
  "study",
  "misc",
] as const;

export const CONDITION_VALUES = ["new", "like_new", "good", "fair"] as const;

export const createListingSchema = z.object({
  title: z.string().trim().min(3, "Başlık en az 3 karakter olmalı.").max(80),
  description: z.string().trim().min(10, "Açıklama en az 10 karakter olmalı.").max(2000),
  category: z.enum(CATEGORY_VALUES),
  condition: z.enum(CONDITION_VALUES),
  isFree: z.boolean(),
  // Price in kuruş; required when not free.
  price: z.number().int().nonnegative().max(10_000_000_00, "Fiyat çok yüksek."),
  city: z.string().trim().min(2).max(40),
  pickupLocation: z.string().trim().max(120).optional().nullable(),
  // Storage paths (NOT full URLs) so they're tied to the project.
  images: z.array(z.string().min(1)).min(1, "En az bir fotoğraf gerekli.").max(8),
});

export type CreateListingInput = z.infer<typeof createListingSchema>;

export const CATEGORY_LABELS: Record<(typeof CATEGORY_VALUES)[number], string> = {
  electronics: "Elektronik",
  furniture: "Mobilya",
  books: "Kitaplar",
  dorm: "Yurt",
  kitchen: "Mutfak",
  clothing: "Giyim",
  transport: "Ulaşım",
  study: "Ders Notu",
  misc: "Diğer",
};

export const CONDITION_LABELS: Record<(typeof CONDITION_VALUES)[number], string> = {
  new: "Sıfır",
  like_new: "Yeni Gibi",
  good: "İyi",
  fair: "Orta",
};
