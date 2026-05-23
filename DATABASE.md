# UniMarket — Database Schema

PostgreSQL via Supabase. Defined in **two complementary places**:
- `prisma/schema.prisma` — for typed app code, migrations, seed scripts.
- `supabase/migrations/*.sql` — for RLS, triggers, realtime — things Prisma doesn't model well.

---

## Entity overview

```
   users ──┬──< listings ──┬──< reservations >─── chats ──< messages
           │                │
           └──< favorites >─┘
           │
           └──< reports
           │
           └──< transactions
```

## Tables

### `users` (extends `auth.users`)
Row inserted by trigger on `auth.users` signup.

| column | type | notes |
|---|---|---|
| `id` | uuid PK | = `auth.users.id` |
| `email` | text unique | from auth |
| `full_name` | text | |
| `university` | text | derived from email domain |
| `department` | text | optional |
| `avatar_url` | text | Supabase Storage URL |
| `verified_student` | bool default false | flipped true after OTP on .edu.tr |
| `role` | enum('buyer','seller','both','admin') default 'both' | |
| `rating_avg` | numeric(3,2) default 0 | |
| `rating_count` | int default 0 | |
| `created_at` | timestamptz default now() | |

### `university_domains`
| column | type | notes |
|---|---|---|
| `domain` | text PK | e.g. `boun.edu.tr` |
| `university_name` | text | e.g. `Boğaziçi Üniversitesi` |
| `city` | text | |

### `listings`
| column | type | notes |
|---|---|---|
| `id` | uuid PK | |
| `seller_id` | uuid FK users | |
| `title` | text | |
| `description` | text | |
| `category` | enum | electronics/furniture/books/dorm/kitchen/clothing/transport/study/misc |
| `condition` | enum | new/like_new/good/fair |
| `price` | int | TRY kuruş (or 0 if free) |
| `is_free` | bool | denormalized for fast filter |
| `images` | text[] | Storage paths |
| `city` | text | |
| `pickup_location` | text | freeform like "Kuzey Kampüs Köyü" |
| `status` | enum | active/reserved/sold/expired |
| `view_count` | int default 0 | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

Indexes: `(status, created_at desc)`, `(category, status)`, `(city, status)`, GIN on `to_tsvector(title || description)`.

### `reservations`
| column | type | notes |
|---|---|---|
| `id` | uuid PK | |
| `listing_id` | uuid FK | |
| `buyer_id` | uuid FK users | |
| `seller_id` | uuid FK users | denormalized |
| `status` | enum | pending/accepted/rejected/cancelled/completed |
| `message` | text | optional intro message from buyer |
| `created_at` | timestamptz | |
| `responded_at` | timestamptz | |

Unique partial: `(listing_id, buyer_id) WHERE status IN ('pending','accepted')` — one active reservation per buyer per listing.

### `chats`
Created automatically by trigger when `reservations.status` becomes `accepted`.

| column | type | notes |
|---|---|---|
| `id` | uuid PK | |
| `reservation_id` | uuid FK unique | |
| `created_at` | timestamptz | |

### `messages`
| column | type | notes |
|---|---|---|
| `id` | uuid PK | |
| `chat_id` | uuid FK | |
| `sender_id` | uuid FK users | |
| `content` | text | |
| `read_at` | timestamptz null | |
| `created_at` | timestamptz | |

### `favorites`
| column | type | notes |
|---|---|---|
| `user_id` | uuid FK | composite PK |
| `listing_id` | uuid FK | composite PK |
| `created_at` | timestamptz | |

### `reports`
| column | type | notes |
|---|---|---|
| `id` | uuid PK | |
| `reporter_id` | uuid FK | |
| `target_type` | enum | listing/user |
| `target_id` | uuid | |
| `reason` | enum | spam/scam/inappropriate/other |
| `details` | text | |
| `status` | enum | open/reviewing/resolved |
| `created_at` | timestamptz | |

### `transactions` (scaffolded, not used in MVP)
| column | type | notes |
|---|---|---|
| `id` | uuid PK | |
| `listing_id` | uuid FK | |
| `buyer_id` | uuid FK | |
| `seller_id` | uuid FK | |
| `amount` | int | kuruş |
| `commission` | int | 5% of amount |
| `status` | enum | pending/held/released/refunded |
| `created_at` | timestamptz | |

---

## RLS policies (the critical part)

```sql
-- USERS: public read of safe fields, only self-update
create policy "users_select" on users for select using (true);
create policy "users_update_self" on users for update using (auth.uid() = id);

-- LISTINGS: public read of active; seller can insert/update own
create policy "listings_select" on listings for select using (status = 'active' or seller_id = auth.uid());
create policy "listings_insert" on listings for insert with check (seller_id = auth.uid());
create policy "listings_update_own" on listings for update using (seller_id = auth.uid());

-- RESERVATIONS: only verified students can create; visible to buyer & seller
create policy "reservations_select" on reservations for select
  using (buyer_id = auth.uid() or seller_id = auth.uid());

create policy "reservations_insert_verified" on reservations for insert with check (
  buyer_id = auth.uid()
  and exists (select 1 from users where id = auth.uid() and verified_student = true)
  and exists (select 1 from listings where id = listing_id and status = 'active' and seller_id <> auth.uid())
);

create policy "reservations_update_seller" on reservations for update
  using (seller_id = auth.uid());

-- MESSAGES: only participants of an ACCEPTED reservation
create policy "messages_select" on messages for select using (
  exists (
    select 1 from chats c
    join reservations r on r.id = c.reservation_id
    where c.id = chat_id and (r.buyer_id = auth.uid() or r.seller_id = auth.uid())
  )
);

create policy "messages_insert" on messages for insert with check (
  sender_id = auth.uid()
  and exists (
    select 1 from chats c
    join reservations r on r.id = c.reservation_id
    where c.id = chat_id
      and r.status = 'accepted'
      and (r.buyer_id = auth.uid() or r.seller_id = auth.uid())
  )
);
```

## Triggers

1. **`on_auth_user_created`** — creates a `users` row from `auth.users`.
2. **`on_email_verified`** — sets `verified_student=true` and stamps `university` if email domain is in `university_domains`.
3. **`on_reservation_accepted`** — creates a `chats` row.
4. **`bump_listing_status`** — sets listing to `reserved` when a reservation is accepted.
