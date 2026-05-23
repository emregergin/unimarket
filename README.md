# UniMarket

> Trusted second-hand marketplace for verified Turkish university students.

A mobile-first marketplace where **only verified `.edu.tr` students can buy/reserve**, but anyone can sell. Differentiators:

- **Verification-gated buying** — enforced at three layers (middleware, RSC, RLS).
- **Post-reservation-only chat** — no spam DMs; messaging unlocks when a reservation is accepted.
- **Free items get visual priority** in the feed, supporting a sustainable student economy.
- **Trust loop**: complete handoff → 1-5 star rating → automatic reputation recompute.
- **Safety toolbox**: report, block, rate-limit, listing expiration.

## Documents

- 📐 [`ARCHITECTURE.md`](./ARCHITECTURE.md) — system architecture & data flows
- 🗺️ [`ROADMAP.md`](./ROADMAP.md) — 5-stage delivery plan & status
- 🗄️ [`DATABASE.md`](./DATABASE.md) — schema, RLS, triggers
- 🎨 [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) — tokens & component anatomy
- 🚀 [`DEPLOY.md`](./DEPLOY.md) — production launch checklist

## Status — MVP COMPLETE ✅

| Stage | What |
|---|---|
| 1 ✅ | Planning, scaffold, design system, mock prototype |
| 2 ✅ | Supabase auth, OTP, three-layer route guards |
| 3 ✅ | Listing creator, Storage uploads, real feed, favorites |
| 4 ✅ | Reservation flow, realtime chat with lock state |
| 5 ✅ | Trust/safety primitives, ratings, polish, deploy guide |

```
✓ Compiled successfully
✓ 16 routes generated
✓ Zero TypeScript errors
✓ Largest page: 19.2 kB (/sat with image preview)
✓ Shared First Load JS: 100 kB
```

## Local development

```bash
cd unimarket
npm install
cp .env.example .env.local       # fill Supabase vars (optional for UI preview)
npm run dev                       # http://localhost:3000
```

Without Supabase env vars the app runs in **preview mode**: mock data feeds the screens so you can review the entire design end-to-end. With real env vars + migrations applied, everything is live.

## Quick provisioning

See [`DEPLOY.md`](./DEPLOY.md) for the full checklist. TL;DR:

```bash
npx prisma db push
psql "$DIRECT_URL" -f supabase/migrations/0001_rls_and_triggers.sql
psql "$DIRECT_URL" -f supabase/migrations/0002_storage.sql
psql "$DIRECT_URL" -f supabase/migrations/0003_blocks_ratings_limits.sql
psql "$DIRECT_URL" -f supabase/seed.sql
```

## Route map

| Route | Auth | Description |
|---|---|---|
| `/` | public | Onboarding |
| `/giris`, `/kayit` | public | OTP login / signup |
| `/dogrulama` | signed-in | University email verification |
| `/kesfet` | verified | Marketplace feed |
| `/ara` | verified | Search (stub) |
| `/sat` | signed-in | Create listing (rate-limited 5/24h) |
| `/favoriler` | verified | Wishlist |
| `/profil` | signed-in | Account |
| `/profil/engellenenler` | signed-in | Blocked users management |
| `/ilan/[id]` | signed-in | Listing detail + report dialog |
| `/ilan/[id]/rezervasyon` | verified | Send reservation request |
| `/rezervasyonlar` | signed-in | Reservation inbox (in/out tabs) + rating flow |
| `/sohbet` | signed-in | All chats |
| `/sohbet/[id]` | participant | 1-to-1 chat (locked until accepted) |

## Key technical decisions

1. **Turkish route slugs** match the user mental model and the UI references.
2. **`@supabase/ssr` with three clients** (browser, server, middleware) — official Next 15 pattern.
3. **RLS is the final gate** — every write rule is enforced in Postgres; the UI is just convenience.
4. **Image uploads bypass Server Actions** via signed Storage URLs → no large payloads through Next.
5. **DB triggers create chats** and **recompute ratings** → invariants enforced at the data layer.
6. **`is_free` is denormalized** for fast filtering on the most important UX axis.
7. **Light/dark mode via HSL CSS variables** → semantic tokens, not literal colors.
8. **Optimistic UI** (favorites, chat messages, reservation responses) with rollback on error.
9. **Rate limit at the DB** via `BEFORE INSERT` trigger — impossible to bypass via client.
10. **Listing expiration via `pg_cron`** — no separate worker infra needed.
