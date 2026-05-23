# UniMarket — Design System

Extracted from the four UI reference screens. Mobile-first, premium-minimal.

## Color tokens

Semantic tokens via CSS variables so dark mode is a single class toggle.

```css
:root {
  --background: 0 0% 100%;        /* white */
  --foreground: 222 15% 10%;      /* near-black text */
  --muted: 220 14% 96%;           /* #F4F5F7 card surfaces */
  --muted-foreground: 220 9% 46%; /* gray text */
  --border: 220 13% 91%;          /* subtle dividers */
  --primary: 222 15% 10%;         /* black CTA */
  --primary-foreground: 0 0% 100%;
  --accent-success: 142 71% 38%;  /* green (Eko-Etki, ÜCRETSİZ) */
  --accent-success-bg: 142 76% 95%;
  --accent-info: 217 91% 50%;     /* blue (Onaylı/Doğrulanmış) */
  --accent-info-bg: 217 91% 95%;
  --destructive: 0 72% 51%;
  --ring: 222 15% 10%;
}

.dark {
  --background: 222 18% 7%;
  --foreground: 0 0% 98%;
  --muted: 222 14% 13%;
  --muted-foreground: 220 9% 65%;
  --border: 222 14% 18%;
  --primary: 0 0% 98%;
  --primary-foreground: 222 15% 10%;
  --accent-success: 142 65% 50%;
  --accent-success-bg: 142 50% 14%;
  --accent-info: 217 91% 65%;
  --accent-info-bg: 217 60% 16%;
}
```

## Typography

- **Font**: Inter (`next/font/google`), with system fallback.
- **Scale**:
  - Display: 28/34 bold (page titles)
  - Title: 20/28 semibold (section headers like "Detaylar")
  - Body: 15/22 normal
  - Caption: 13/18 medium (price, labels)
  - Micro: 11/14 medium (badges)

## Spacing & radius

- Base unit: 4px (Tailwind default).
- Card radius: `rounded-2xl` (16px).
- Pill/badge radius: `rounded-full`.
- Image radius: `rounded-xl` (12px) inside cards.
- Page horizontal padding: `px-4` (16px) on mobile, `px-6` on sm+.
- Bottom nav height: 64px + safe-area-inset.
- Sticky action bar height: 76px + safe-area-inset.

## Shadows

- Card rest: `shadow-[0_1px_2px_rgba(0,0,0,0.04)]`
- Card hover/press: `shadow-[0_4px_16px_rgba(0,0,0,0.06)]`
- Sticky bar: `shadow-[0_-4px_20px_rgba(0,0,0,0.04)]`

## Component anatomy (matched to references)

### Badge variants
| variant | bg | fg | use |
|---|---|---|---|
| `success` | `--accent-success-bg` | `--accent-success` | Eko-Etki, ÜCRETSİZ, Doğrulanmış Öğrenci |
| `info`    | `--accent-info-bg`    | `--accent-info`    | Onaylı |
| `neutral` | `--muted`             | `--foreground`     | Yeni Gibi, condition labels |

### Button variants
| variant | bg | fg | border |
|---|---|---|---|
| `primary` | `--primary` (black) | white | none — used for "Devam Et", "Rezervasyon İsteği Gönder" |
| `secondary` | `--background` | `--foreground` | `--border` 1px |
| `ghost` | transparent | `--foreground` | none |
| `icon` | `--muted` | `--foreground` | none, square 44px |

### Listing card (feed)
- Square image top, `aspect-square`, `rounded-2xl` outer
- Heart icon top-right, circular white pill with blur backdrop
- Free badge bottom-left (green pill) when `is_free`
- Below image: title (2-line clamp), then price OR "ÜCRETSİZ" in green, then `📍 city` micro text.

### Bottom nav
- 5 items, equal width, 64px tall, top border `--border`
- Active item: icon + label in `--foreground`, inactive: `--muted-foreground`
- Center "Sat" item gets emphasized — a 48px black circle with white plus icon

### Sticky action bar (product detail)
- White bg with top border
- Left: small "Toplam Fiyat" + price stack
- Center: 44px circular favorite button (light gray bg)
- Right: full-width black primary CTA

## Iconography

`lucide-react`. Stroke width 2, size 20 by default, 24 in nav.

## Motion

- Tap feedback: `active:scale-[0.98] transition-transform duration-100`
- Page enter: subtle 200ms fade
- Skeleton shimmer: 1.5s linear infinite
- No bouncy / playful springs — keep it calm.
