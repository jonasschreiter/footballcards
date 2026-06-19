-- Migration: Supabase Storage fuer Kartenbilder
-- Erstellt den Bucket "card-images" und Zugriffspolicies pro User-Ordner

insert into storage.buckets (id, name, public)
values ('card-images', 'card-images', true)
on conflict (id) do update
set
  name = excluded.name,
  public = excluded.public;

drop policy if exists "Card images are public" on storage.objects;
drop policy if exists "Users can upload own card images" on storage.objects;
drop policy if exists "Users can update own card images" on storage.objects;
drop policy if exists "Users can delete own card images" on storage.objects;

create policy "Card images are public"
  on storage.objects
  for select
  using (bucket_id = 'card-images');

create policy "Users can upload own card images"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'card-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can update own card images"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'card-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'card-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete own card images"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'card-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
