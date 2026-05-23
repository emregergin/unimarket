# UniMarket — System Architecture

> Trusted second-hand marketplace for verified Turkish university students.

---

## 1. High-level architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js 15 (App Router)              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │   Server     │  │    Client    │  │    Route     │   │
│  │  Components  │  │  Components  │  │   Handlers   │   │
│  │  (RSC, SSR)  │  │  ("use      │  │   (/api/*)   │   │
│  │              │  │   client")   │  │              │   │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘   │
│         │                 │                  │           │
│         └─────────────────┼──────────────────┘           │
│                           │                              │
│                  ┌────────▼─────────┐                    │
│                  │  Supabase Client │                    │
│                  │  (SSR helpers)   │                    │
│                  └────────┬─────────┘                    │
└───────────────────────────┼──────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
   ┌────▼─────┐      ┌──────▼──────┐     ┌──────▼──────┐
   │ Supabase │      │  Supabase   │     │  Supabase   │
   │   Auth   │      │  Postgres   │     │   Storage   │
   │ (OTP+JWT)│      │  (+ RLS)    │     │  (images)   │
   └──────────┘      └──────┬──────┘     └─────────────┘
                            │
                     ┌──────▼──────┐
                     │  Supabase   │
                     │  Realtime   │
                     │  (chat)     │
                     └─────────────┘
```

**Why this stack:**
- **Next.js 15 + RSC** → fast marketplace feed (server-rendered grids, no JS waterfall).
- **Supabase Auth (OTP/magic-link)** → no passwords; perfect for `.edu.tr` email verification.
- **Postgres + RLS** → security at the row level (a buyer literally *cannot* read another user's chat).
- **Realtime channels** → chat without managing WebSocket infra.
- **Storage** → image uploads with signed URLs and transform-on-the-fly.

---

## 2. Verification flow (the core trust mechanism)

```
 user signs up
      │
      ▼
 enters email ──► is domain in `university_domains` table?
                          │
              no ─────────┤────────── yes
              │                        │
              ▼                        ▼
     show "use .edu.tr"       send OTP via Supabase
     fallback: doc upload     │
     (future)                 ▼
                       user enters 6-digit code
                              │
                              ▼
                  on success: trigger sets
                  `users.verified_student = true`
                  `users.university = <domain lookup>`
```

**Rule enforced by RLS, not just UI:**
- `reservations` table: `INSERT` requires `auth.uid()` to have `verified_student = true`.
- `messages` table: `INSERT` requires the user to be a participant of a chat whose reservation is `accepted`.

This means even a malicious API caller cannot bypass verification.

---

## 3. Folder structure (Next.js 15 App Router)

```
unimarket/
├── ARCHITECTURE.md                  ← this file
├── ROADMAP.md                       ← stage-by-stage plan
├── DATABASE.md                      ← schema + RLS policies
├── DESIGN_SYSTEM.md                 ← tokens, components, spacing
│
├── prisma/
│   ├── schema.prisma                ← single source of truth
│   └── seed.ts                      ← demo data (universities, sample listings)
│
├── supabase/
│   ├── migrations/                  ← SQL migrations (auth triggers, RLS)
│   └── seed.sql                     ← seed extension for storage buckets
│
├── public/
│   └── (static assets)
│
├── src/
│   ├── app/                         ← App Router
│   │   ├── (marketing)/             ← unauth routes
│   │   │   ├── page.tsx             ← onboarding / landing
│   │   │   └── layout.tsx
│   │   │
│   │   ├── (auth)/
│   │   │   ├── giris/page.tsx       ← /giris  (login)
│   │   │   ├── kayit/page.tsx       ← /kayit  (signup)
│   │   │   ├── dogrulama/page.tsx   ← /dogrulama (verification)
│   │   │   └── layout.tsx
│   │   │
│   │   ├── (app)/                   ← authed shell (bottom nav)
│   │   │   ├── layout.tsx           ← injects <BottomNav />
│   │   │   ├── kesfet/page.tsx      ← /kesfet  (marketplace feed)
│   │   │   ├── ara/page.tsx         ← /ara     (search)
│   │   │   ├── sat/page.tsx         ← /sat     (create listing)
│   │   │   ├── favoriler/page.tsx   ← /favoriler
│   │   │   ├── profil/page.tsx      ← /profil
│   │   │   ├── ilan/[id]/page.tsx   ← product detail
│   │   │   ├── rezervasyonlar/      ← reservation inbox
│   │   │   └── sohbet/[id]/page.tsx ← chat (post-reservation only)
│   │   │
│   │   ├── api/                     ← route handlers
│   │   │   ├── auth/                ← OTP send/verify wrappers
│   │   │   ├── listings/
│   │   │   ├── reservations/
│   │   │   ├── chats/
│   │   │   ├── favorites/
│   │   │   └── reports/
│   │   │
│   │   ├── layout.tsx               ← root + ThemeProvider
│   │   └── globals.css              ← Tailwind + CSS vars
│   │
│   ├── components/
│   │   ├── ui/                      ← primitives (Button, Input, Badge, Card)
│   │   ├── listing/                 ← ListingCard, ListingGrid, ImageCarousel
│   │   ├── chat/                    ← MessageBubble, ChatInput
│   │   ├── nav/                     ← BottomNav, TopBar
│   │   └── verification/            ← VerifiedBadge, EmailDomainCheck
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts            ← browser client
│   │   │   ├── server.ts            ← RSC + route-handler client
│   │   │   └── middleware.ts        ← session refresh
│   │   ├── auth/
│   │   │   └── university-domains.ts ← whitelist
│   │   ├── validators/              ← zod schemas
│   │   └── utils.ts                 ← cn(), formatPrice(), etc.
│   │
│   ├── hooks/
│   │   ├── use-user.ts
│   │   ├── use-favorites.ts
│   │   └── use-realtime-chat.ts
│   │
│   ├── types/
│   │   └── database.ts              ← generated from Supabase
│   │
│   └── middleware.ts                ← auth guard + verification guard
│
├── .env.example
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

**Conventions:**
- Route segments use **Turkish slugs** (`/kesfet`, `/sat`, `/ilan/[id]`) — matches user mental model and screens.
- Route groups `(marketing)`, `(auth)`, `(app)` give us **three distinct layouts** without polluting URLs.
- All UI primitives in `components/ui/` use **CVA + Tailwind** — copy-paste-friendly like shadcn but minimal.

---

## 4. Auth & route protection

Three guard layers, defense-in-depth:

| Layer | Where | What it does |
|---|---|---|
| 1. **Middleware** | `src/middleware.ts` | Redirects unauth → `/giris`. Redirects unverified → `/dogrulama` when entering `(app)`. |
| 2. **Server component check** | `(app)/layout.tsx` | Re-checks session + verified_student. |
| 3. **RLS policies** | Postgres | Final gate — even if both above are bypassed, DB refuses the write. |

---

## 5. Data flow examples

### Browse feed
```
RSC <FeedPage /> → supabase.from('listings').select(...).range(0,19)
                 → renders <ListingCard /> grid
                 → infinite scroll via client component fetches range(20,39)
```

### Reserve an item
```
client → POST /api/reservations { listingId }
       → server validates: user verified? listing active? not own listing?
       → INSERT reservations (status='pending')
       → seller gets realtime notification
       → seller accepts → status='accepted' → trigger creates chat row
       → both users can now /sohbet/[chatId]
```

### Chat (post-reservation only)
```
client subscribes: supabase.channel('chat:' + chatId)
INSERT messages → RLS checks: am I a participant? is reservation accepted?
                → broadcast to subscribers → UI appends bubble
```

---

## 6. Non-goals for MVP

- ❌ Payments (architecture-ready via `transactions` table, no Stripe yet)
- ❌ Push notifications (in-app realtime only)
- ❌ Native mobile apps
- ❌ SEO / public listing pages
- ❌ Admin dashboard (use Supabase Studio for moderation)
- ❌ Ads / promoted listings
