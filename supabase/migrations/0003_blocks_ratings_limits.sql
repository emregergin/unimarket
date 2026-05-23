-- UniMarket — Stage 5 hardening
-- Blocks, ratings, rate limiting, listing expiration.

-- ── BLOCKS ───────────────────────────────────────────────────────
create table if not exists public.blocks (
  blocker_id uuid not null references public.users(id) on delete cascade,
  blocked_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

alter table public.blocks enable row level security;

create policy "blocks_select_own" on public.blocks
  for select using (blocker_id = auth.uid());

create policy "blocks_modify_own" on public.blocks
  for all using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());

-- Hide listings from blocked sellers (and vice versa) at the listing layer.
-- We do this with a stricter SELECT policy; replace the existing one.
drop policy if exists "listings_select_active_or_own" on public.listings;
create policy "listings_select_active_or_own" on public.listings
  for select using (
    (status = 'active'
      and not exists (
        select 1 from public.blocks b
        where (b.blocker_id = auth.uid() and b.blocked_id = seller_id)
           or (b.blocked_id = auth.uid() and b.blocker_id = seller_id)
      ))
    or seller_id = auth.uid()
  );

-- Prevent reservations between blocked parties.
drop policy if exists "reservations_insert_verified_buyer" on public.reservations;
create policy "reservations_insert_verified_buyer" on public.reservations
  for insert with check (
    buyer_id = auth.uid()
    and exists (
      select 1 from public.users
      where id = auth.uid() and verified_student = true
    )
    and exists (
      select 1 from public.listings
      where id = listing_id and status = 'active' and seller_id <> auth.uid()
    )
    and not exists (
      select 1 from public.blocks b
      where (b.blocker_id = auth.uid() and b.blocked_id = seller_id)
         or (b.blocked_id = auth.uid() and b.blocker_id = seller_id)
    )
  );

-- ── RATINGS ──────────────────────────────────────────────────────
-- Ratings exist only after a reservation is marked 'completed'.
-- Both parties can rate each other once per reservation.
create table if not exists public.ratings (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations(id) on delete cascade,
  rater_id uuid not null references public.users(id) on delete cascade,
  ratee_id uuid not null references public.users(id) on delete cascade,
  stars int not null check (stars between 1 and 5),
  comment text check (char_length(comment) <= 500),
  created_at timestamptz not null default now(),
  unique (reservation_id, rater_id)
);

alter table public.ratings enable row level security;

create policy "ratings_select_all" on public.ratings
  for select using (true);

create policy "ratings_insert_participant" on public.ratings
  for insert with check (
    rater_id = auth.uid()
    and exists (
      select 1 from public.reservations r
      where r.id = reservation_id
        and r.status = 'completed'
        and (r.buyer_id = auth.uid() or r.seller_id = auth.uid())
        and (r.buyer_id = ratee_id or r.seller_id = ratee_id)
        and ratee_id <> auth.uid()
    )
  );

-- Recompute the ratee's average + count whenever a rating is added.
create or replace function public.recompute_user_rating()
returns trigger as $$
begin
  update public.users u
  set rating_avg = coalesce((select avg(stars)::numeric(3,2) from public.ratings where ratee_id = new.ratee_id), 0),
      rating_count = (select count(*) from public.ratings where ratee_id = new.ratee_id)
  where u.id = new.ratee_id;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_rating_inserted on public.ratings;
create trigger on_rating_inserted
  after insert on public.ratings
  for each row execute function public.recompute_user_rating();

-- ── RATE LIMIT: max 5 active listings created per 24h per user ──
create or replace function public.enforce_listing_rate_limit()
returns trigger as $$
declare
  recent_count int;
begin
  select count(*)
    into recent_count
    from public.listings
   where seller_id = new.seller_id
     and created_at > now() - interval '24 hours';

  if recent_count >= 5 then
    raise exception 'rate_limit_exceeded'
      using errcode = 'P0001',
            hint = 'Son 24 saatte en fazla 5 ilan oluşturabilirsin. Lütfen yarın tekrar dene.';
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists enforce_listing_rate_limit on public.listings;
create trigger enforce_listing_rate_limit
  before insert on public.listings
  for each row execute function public.enforce_listing_rate_limit();

-- ── EXPIRATION: mark listings as expired after 30 days inactive ──
create or replace function public.expire_stale_listings()
returns int as $$
declare
  updated_count int;
begin
  with upd as (
    update public.listings
       set status = 'expired'
     where status = 'active'
       and updated_at < now() - interval '30 days'
     returning 1
  )
  select count(*) into updated_count from upd;
  return updated_count;
end;
$$ language plpgsql security definer;

-- Schedule with pg_cron (requires extension enabled in Supabase Dashboard):
--   select cron.schedule('expire-listings-daily', '0 3 * * *', $$select public.expire_stale_listings();$$);

-- ── BUMP updated_at on listings on any change ─────────────────
create or replace function public.touch_listing_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists touch_listing_updated_at on public.listings;
create trigger touch_listing_updated_at
  before update on public.listings
  for each row execute function public.touch_listing_updated_at();
