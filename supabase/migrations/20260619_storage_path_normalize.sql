-- Migration: Normalize legacy public/authenticated/signed storage URLs to bucket-internal paths
-- This keeps image_url stable after switching bucket access to private + signed URLs.

update public.cards
set image_url = split_part(
  regexp_replace(
    image_url,
    '^https?://[^/]+/storage/v1/object/(public|authenticated|sign)/card-images/',
    ''
  ),
  '?',
  1
)
where image_url is not null
  and image_url ~ '^https?://[^/]+/storage/v1/object/(public|authenticated|sign)/card-images/';
