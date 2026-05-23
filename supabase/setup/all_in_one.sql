-- ╔════════════════════════════════════════════════════════════════╗
-- ║  UniMarket — Tek seferlik kurulum SQL'i                       ║
-- ║  Supabase Dashboard → SQL Editor → New query → buraya yapıştır║
-- ║  → Run                                                        ║
-- ╚════════════════════════════════════════════════════════════════╝

-- ÖNCE Prisma db push çalıştırıldığını varsayar (tablolar oluşmuş olmalı).
-- Bu dosya RLS, trigger, storage ve seed verilerini ekler.

-- ───────────────────────────────────────────────────────────────
-- BÖLÜM 1: RLS Politikaları + Trigger'lar
-- ───────────────────────────────────────────────────────────────
-- UniMarket — RLS policies & triggers
-- Apply AFTER `prisma db push` creates the tables.

-- ── Enable RLS on all user-facing tables ─────────────────────────
alter table public.users           enable row level security;
alter table public.listings        enable row level security;
alter table public.reservations    enable row level security;
alter table public.chats           enable row level security;
alter table public.messages        enable row level security;
alter table public.favorites       enable row level security;
alter table public.reports         enable row level security;
alter table public.transactions    enable row level security;

-- ── USERS ─────────────────────────────────────────────────────────
create policy "users_select_all" on public.users
  for select using (true);

create policy "users_update_self" on public.users
  for update using (auth.uid() = id);

-- ── LISTINGS ──────────────────────────────────────────────────────
create policy "listings_select_active_or_own" on public.listings
  for select using (status = 'active' or seller_id = auth.uid());

create policy "listings_insert_own" on public.listings
  for insert with check (seller_id = auth.uid());

create policy "listings_update_own" on public.listings
  for update using (seller_id = auth.uid());

create policy "listings_delete_own" on public.listings
  for delete using (seller_id = auth.uid());

-- ── RESERVATIONS ─────────────────────────────────────────────────
create policy "reservations_select_participants" on public.reservations
  for select using (buyer_id = auth.uid() or seller_id = auth.uid());

create policy "reservations_insert_verified_buyer" on public.reservations
  for insert with check (
    buyer_id = auth.uid()
    and exists (
      select 1 from public.users
      where id = auth.uid() and verified_student = true
    )
    and exists (
      select 1 from public.listings
      where id = listing_id
        and status = 'active'
        and seller_id <> auth.uid()
    )
  );

create policy "reservations_update_seller" on public.reservations
  for update using (seller_id = auth.uid());

create policy "reservations_update_buyer_cancel" on public.reservations
  for update using (buyer_id = auth.uid() and status = 'pending');

-- ── CHATS ────────────────────────────────────────────────────────
create policy "chats_select_participants" on public.chats
  for select using (
    exists (
      select 1 from public.reservations r
      where r.id = reservation_id
        and (r.buyer_id = auth.uid() or r.seller_id = auth.uid())
    )
  );

-- ── MESSAGES ─────────────────────────────────────────────────────
create policy "messages_select_participants" on public.messages
  for select using (
    exists (
      select 1 from public.chats c
      join public.reservations r on r.id = c.reservation_id
      where c.id = chat_id
        and (r.buyer_id = auth.uid() or r.seller_id = auth.uid())
    )
  );

create policy "messages_insert_accepted_only" on public.messages
  for insert with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.chats c
      join public.reservations r on r.id = c.reservation_id
      where c.id = chat_id
        and r.status = 'accepted'
        and (r.buyer_id = auth.uid() or r.seller_id = auth.uid())
    )
  );

-- ── FAVORITES ────────────────────────────────────────────────────
create policy "favorites_select_own" on public.favorites
  for select using (user_id = auth.uid());

create policy "favorites_modify_own" on public.favorites
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── REPORTS ──────────────────────────────────────────────────────
create policy "reports_insert_own" on public.reports
  for insert with check (reporter_id = auth.uid());

create policy "reports_select_own" on public.reports
  for select using (reporter_id = auth.uid());

-- ── TRIGGERS ─────────────────────────────────────────────────────

-- 1) Create public.users row on auth signup
create or replace function public.handle_new_auth_user()
returns trigger as $$
declare
  v_domain text;
  v_uni    text;
begin
  v_domain := lower(split_part(new.email, '@', 2));
  select university_name into v_uni from public.university_domains where domain = v_domain;

  insert into public.users (id, email, university, verified_student)
  values (new.id, new.email, v_uni, false);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- 2) On email confirmation, flip verified_student if email is on the .edu.tr allowlist
create or replace function public.handle_email_confirmed()
returns trigger as $$
declare
  v_domain text;
  v_uni    text;
begin
  if new.email_confirmed_at is not null and old.email_confirmed_at is null then
    v_domain := lower(split_part(new.email, '@', 2));
    select university_name into v_uni from public.university_domains where domain = v_domain;
    if v_uni is not null then
      update public.users
      set verified_student = true,
          university = v_uni
      where id = new.id;
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_confirmed on auth.users;
create trigger on_auth_user_confirmed
  after update on auth.users
  for each row execute function public.handle_email_confirmed();

-- 3) On reservation accepted → create chat, mark listing reserved
create or replace function public.handle_reservation_accepted()
returns trigger as $$
begin
  if new.status = 'accepted' and (old.status is distinct from 'accepted') then
    insert into public.chats (reservation_id) values (new.id) on conflict do nothing;
    update public.listings set status = 'reserved' where id = new.listing_id;
    new.responded_at := now();
  elsif new.status = 'rejected' and (old.status is distinct from 'rejected') then
    new.responded_at := now();
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_reservation_status_change on public.reservations;
create trigger on_reservation_status_change
  before update on public.reservations
  for each row execute function public.handle_reservation_accepted();

-- 4) Realtime publication for messages & reservations
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.reservations;

-- ───────────────────────────────────────────────────────────────
-- BÖLÜM 2: Storage Bucket'ları
-- ───────────────────────────────────────────────────────────────
-- Storage bucket for listing photos. Public-readable so we don't have to
-- sign URLs on every feed render. Write requires the owning user.

insert into storage.buckets (id, name, public)
values ('listings', 'listings', true)
on conflict (id) do nothing;

-- Anyone can read (we serve images on public listings).
create policy "listing_images_public_read"
  on storage.objects for select
  using (bucket_id = 'listings');

-- Authenticated users can upload to a folder named with their own user id.
-- Path convention: <user_id>/<uuid>.jpg
create policy "listing_images_owner_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'listings'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "listing_images_owner_delete"
  on storage.objects for delete
  using (
    bucket_id = 'listings'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ───────────────────────────────────────────────────────────────
-- BÖLÜM 3: Blocks, Ratings, Rate Limits
-- ───────────────────────────────────────────────────────────────
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

-- ───────────────────────────────────────────────────────────────
-- BÖLÜM 4: Üniversite Domain Allow-list (Seed)
-- ───────────────────────────────────────────────────────────────
-- Seed Turkish university domain allow-list (extend as needed)
insert into public.university_domains (domain, university_name, city) values
  ('boun.edu.tr',      'Boğaziçi Üniversitesi',           'İstanbul'),
  ('metu.edu.tr',      'Orta Doğu Teknik Üniversitesi',   'Ankara'),
  ('itu.edu.tr',       'İstanbul Teknik Üniversitesi',    'İstanbul'),
  ('bilkent.edu.tr',   'Bilkent Üniversitesi',            'Ankara'),
  ('ku.edu.tr',        'Koç Üniversitesi',                'İstanbul'),
  ('sabanciuniv.edu',  'Sabancı Üniversitesi',            'İstanbul'),
  ('hacettepe.edu.tr', 'Hacettepe Üniversitesi',          'Ankara'),
  ('ankara.edu.tr',    'Ankara Üniversitesi',             'Ankara'),
  ('istanbul.edu.tr',  'İstanbul Üniversitesi',           'İstanbul'),
  ('yildiz.edu.tr',    'Yıldız Teknik Üniversitesi',      'İstanbul'),
  ('ege.edu.tr',       'Ege Üniversitesi',                'İzmir'),
  ('deu.edu.tr',       'Dokuz Eylül Üniversitesi',        'İzmir')
on conflict (domain) do nothing;

-- ═══════════════════════════════════════════════════════════════
-- DONE! Tüm hata mesajları görünmüyorsa kurulum başarılıdır.
-- ═══════════════════════════════════════════════════════════════
