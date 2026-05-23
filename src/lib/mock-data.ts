import type { ListingCardData } from "@/components/listing/listing-card";

export const CATEGORIES = [
  { id: "all", label: "Tümü" },
  { id: "free", label: "Ücretsiz" },
  { id: "electronics", label: "Elektronik" },
  { id: "furniture", label: "Mobilya" },
  { id: "books", label: "Kitaplar" },
  { id: "dorm", label: "Yurt" },
  { id: "kitchen", label: "Mutfak" },
  { id: "clothing", label: "Giyim" },
  { id: "study", label: "Ders Notu" },
];

// Unsplash images chosen to roughly match a clean second-hand item aesthetic.
export const MOCK_LISTINGS: (ListingCardData & {
  category: string;
  description: string;
  condition: string;
  distance: number;
})[] = [
  {
    id: "1",
    title: "Minimalist Meşe Çalışma Masası",
    price: 12000,
    isFree: false,
    image:
      "https://images.unsplash.com/photo-1518733057094-95b53143d2a7?w=800&q=80",
    city: "Kuzey Kampüs Köyü",
    isEco: true,
    sellerVerified: true,
    category: "furniture",
    description:
      "Modern meşe çalışma masamı satıyorum. Yurt odası veya küçük bir daire için mükemmel boyutta. Son derece sağlam, masif ahşap yapı. Sadece bir dönem kullanıldı, neredeyse hiç çiziği yok. Sadece elden teslim!",
    condition: "Yeni Gibi",
    distance: 500,
  },
  {
    id: "2",
    title: "Ergonomik Ofis Sandalyesi",
    price: 4500,
    isFree: false,
    image:
      "https://images.unsplash.com/photo-1592078615290-033ee584e267?w=800&q=80",
    city: "Beşiktaş",
    sellerVerified: true,
    category: "furniture",
    description: "Az kullanılmış ergonomik ofis sandalyesi.",
    condition: "İyi",
    distance: 1200,
  },
  {
    id: "3",
    title: "IKEA Kitaplık (3 raflı)",
    price: 3000,
    isFree: false,
    image:
      "https://images.unsplash.com/photo-1594620302200-9a762244a156?w=800&q=80",
    city: "Sarıyer",
    sellerVerified: false,
    category: "furniture",
    description: "Sökülüp kurulabilir IKEA kitaplık.",
    condition: "İyi",
    distance: 2300,
  },
  {
    id: "4",
    title: "MacBook Air M1 — 256GB",
    price: 1850000,
    isFree: false,
    image:
      "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800&q=80",
    city: "Kadıköy",
    sellerVerified: true,
    category: "electronics",
    description: "2 yaşında MacBook Air M1, kutusu mevcut.",
    condition: "Yeni Gibi",
    distance: 4500,
  },
  {
    id: "5",
    title: "Mikroekonomi Ders Kitabı Seti",
    price: 0,
    isFree: true,
    image:
      "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&q=80",
    city: "Beyoğlu",
    sellerVerified: true,
    category: "books",
    description: "Mezun oluyorum, isteyene ücretsiz vereceğim 3 kitap.",
    condition: "İyi",
    distance: 800,
  },
  {
    id: "6",
    title: "Tek Kişilik Yatak + Ortopedik Yatak",
    price: 0,
    isFree: true,
    image:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&q=80",
    city: "Şişli",
    sellerVerified: false,
    category: "dorm",
    description: "Taşınıyorum, sadece elden teslim.",
    condition: "İyi",
    distance: 3100,
  },
  {
    id: "7",
    title: "Espresso Makinesi — DeLonghi",
    price: 220000,
    isFree: false,
    image:
      "https://images.unsplash.com/photo-1572119865084-43c285814d63?w=800&q=80",
    city: "Beşiktaş",
    sellerVerified: true,
    category: "kitchen",
    description: "Tam çalışır durumda.",
    condition: "İyi",
    distance: 1500,
  },
  {
    id: "8",
    title: "Bisiklet — 28 jant şehir tipi",
    price: 350000,
    isFree: false,
    image:
      "https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=800&q=80",
    city: "Maslak",
    isEco: true,
    sellerVerified: true,
    category: "transport",
    description: "Bakımlı, lastikleri yeni.",
    condition: "İyi",
    distance: 2800,
  },
];

export const SELLER = {
  name: "Sarah Jenkins",
  university: "Boğaziçi Üniversitesi",
  avatar:
    "https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=400&q=80",
  verified: true,
  rating: 4.9,
  ratingCount: 12,
};
