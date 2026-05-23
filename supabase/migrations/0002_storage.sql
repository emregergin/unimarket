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
