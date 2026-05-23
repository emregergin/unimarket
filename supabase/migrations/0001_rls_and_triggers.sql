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
