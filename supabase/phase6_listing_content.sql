-- Phase 6: listing content, location and image storage

alter table public.listings
  add column if not exists address text,
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists google_maps_url text,
  add column if not exists images text[];

-- Database-level validation for map coordinates.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'listings_latitude_range_check') then
    alter table public.listings
      add constraint listings_latitude_range_check
      check (latitude is null or latitude between -90 and 90);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'listings_longitude_range_check') then
    alter table public.listings
      add constraint listings_longitude_range_check
      check (longitude is null or longitude between -180 and 180);
  end if;
end $$;

-- Public bucket for listing photos.
-- Upload/delete are still protected by storage.objects RLS policies below.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'listing-images',
  'listing-images',
  true,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Hosts may upload only into their own host/listing folder.
drop policy if exists "Hosts can upload listing images" on storage.objects;
create policy "Hosts can upload listing images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'listing-images'
  and exists (
    select 1
    from public.hosts h
    join public.listings l on l.host_id = h.id
    where h.id::text = (storage.foldername(name))[1]
      and l.id::text = (storage.foldername(name))[2]
      and h.user_id = auth.uid()
      and h.status = 'active'
  )
);

-- Hosts may delete only their own listing images.
drop policy if exists "Hosts can delete listing images" on storage.objects;
create policy "Hosts can delete listing images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'listing-images'
  and exists (
    select 1
    from public.hosts h
    join public.listings l on l.host_id = h.id
    where h.id::text = (storage.foldername(name))[1]
      and l.id::text = (storage.foldername(name))[2]
      and h.user_id = auth.uid()
      and h.status = 'active'
  )
);
