-- Migration: Make card image bucket private and restrict read access per user folder

update storage.buckets
set public = false
where id = 'card-images';

drop policy if exists "Card images are public" on storage.objects;
drop policy if exists "Users can read own card images" on storage.objects;

create policy "Users can read own card images"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'card-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
