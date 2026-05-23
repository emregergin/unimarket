# UniMarket — Development Roadmap

## ✅ Stage 1 — Planning & Foundation

- [x] Architecture document
- [x] Folder structure decision
- [x] Database schema (Prisma + Supabase SQL)
- [x] Design system tokens (colors, typography, spacing)
- [x] Project scaffold (`package.json`, `tsconfig`, `tailwind`, `next.config`)
- [x] Core UI primitives (Button, Input, Badge, Card, BottomNav)
- [x] Mock data layer
- [x] Onboarding screen + Marketplace feed (matching reference screens)

## ✅ Stage 2 — Auth & Verification

- [x] `@supabase/ssr` clients (browser, server, middleware)
- [x] Session-refresh middleware
- [x] Three-layer route guard (middleware → RSC check → RLS)
- [x] Magic-link OTP flow
- [x] `/giris`, `/kayit`, `/dogrulama` two-step UI
- [x] University email allow-list (12 seeded)
- [x] `getCurrentUser()` + `useUser()` helpers
- [x] Sign-out flow

## ✅ Stage 3 — Listings & Feed (real data)

- [x] `/sat` multi-section listing creator
- [x] Direct-to-Storage uploads via signed URLs
- [x] `listings` storage bucket with RLS
- [x] `/kesfet` real backend + mock fallback
- [x] URL-driven filters (debounced)
- [x] Free-items hero strip
- [x] `/ilan/[id]` detail with both DB & mock paths
- [x] Favorites with optimistic UI
- [x] `/favoriler` real query

## ✅ Stage 4 — Reservations & Chat

- [x] `/ilan/[id]/rezervasyon` flow
- [x] `createReservationAction` with verification + RLS enforcement
- [x] `/rezervasyonlar` inbox with tabs
- [x] Accept/reject actions
- [x] DB trigger auto-creates chats
- [x] `/sohbet/[id]` realtime chat
- [x] Pinned listing context header
- [x] Optimistic message sends
- [x] `/sohbet` list of all chats
- [x] Lock state when not accepted

## ✅ Stage 5 — Trust, Safety, Polish

- [x] Reusable `<Dialog />` primitive (sheet + center variants)
- [x] Toast notification system (`<ToastProvider />`, `useToast()`)
- [x] Skeleton component + route-level `loading.tsx` for feed, listing, reservations, chats, favorites
- [x] `<EmptyState />` reused across feed, favorites, reservations, chats, blocked-users
- [x] Global `error.tsx` + `not-found.tsx`
- [x] Report dialog with reason picker + "also block seller" combo
- [x] Block users (table, RLS, server action, dedicated `/profil/engellenenler` page)
- [x] Rate-limit listing creation (5/24h, enforced by Postgres trigger)
- [x] Listing expiration function + documented `pg_cron` schedule
- [x] Rating system: complete handoff → 1-5 stars + comment → auto-recompute averages
- [x] A11y: `aria-current`, `role="tablist"`/`"tab"`, focus rings on nav/chips/dialogs
- [x] `vercel.json` with security headers
- [x] `DEPLOY.md` end-to-end production guide

✓ All `npm run build` checks pass — 17 routes, zero TS errors.

## Stretch (post-MVP)

- Document-based verification fallback (UI exists; admin queue tooling pending)
- Push notifications (web push)
- AI scam detection on listings
- In-app payments + escrow + 5% commission tracking
- QR handoff verification
- University partnership program
- i18n: Turkish → +English for Erasmus students
- Admin dashboard (currently use Supabase Studio)
- Native mobile apps (React Native / Expo)
