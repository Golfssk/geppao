-- Record media-rights evidence and fail closed for public image reads.
begin;

alter table public.place_images
  add column if not exists rights_holder text,
  add column if not exists rights_basis text,
  add column if not exists permission_evidence text,
  add column if not exists permission_date date,
  add column if not exists rights_expires_at date,
  add column if not exists approved_for_public boolean not null default false,
  add column if not exists approved_by uuid references auth.users(id) on delete set null,
  add column if not exists approved_at timestamptz,
  add column if not exists takedown_status text not null default 'active';

alter table public.event_images
  add column if not exists rights_holder text,
  add column if not exists rights_basis text,
  add column if not exists permission_evidence text,
  add column if not exists permission_date date,
  add column if not exists rights_expires_at date,
  add column if not exists approved_for_public boolean not null default false,
  add column if not exists approved_by uuid references auth.users(id) on delete set null,
  add column if not exists approved_at timestamptz,
  add column if not exists takedown_status text not null default 'active';

alter table public.place_images drop constraint if exists place_images_rights_basis_check;
alter table public.place_images add constraint place_images_rights_basis_check
  check(rights_basis is null or rights_basis in('owner','licensed','public_domain','geppao_owned'));
alter table public.place_images drop constraint if exists place_images_takedown_status_check;
alter table public.place_images add constraint place_images_takedown_status_check
  check(takedown_status in('active','requested','removed'));
alter table public.place_images drop constraint if exists place_images_public_approval_check;
alter table public.place_images add constraint place_images_public_approval_check check(
  not approved_for_public or (
    nullif(trim(rights_holder),'') is not null and rights_basis is not null
    and nullif(trim(permission_evidence),'') is not null and permission_date is not null
    and approved_by is not null and approved_at is not null and takedown_status='active'
    and (rights_expires_at is null or rights_expires_at>=permission_date)
  )
);

alter table public.event_images drop constraint if exists event_images_rights_basis_check;
alter table public.event_images add constraint event_images_rights_basis_check
  check(rights_basis is null or rights_basis in('owner','licensed','public_domain','geppao_owned'));
alter table public.event_images drop constraint if exists event_images_takedown_status_check;
alter table public.event_images add constraint event_images_takedown_status_check
  check(takedown_status in('active','requested','removed'));
alter table public.event_images drop constraint if exists event_images_public_approval_check;
alter table public.event_images add constraint event_images_public_approval_check check(
  not approved_for_public or (
    nullif(trim(rights_holder),'') is not null and rights_basis is not null
    and nullif(trim(permission_evidence),'') is not null and permission_date is not null
    and approved_by is not null and approved_at is not null and takedown_status='active'
    and (rights_expires_at is null or rights_expires_at>=permission_date)
  )
);

create index if not exists place_images_public_idx on public.place_images(place_id,is_cover,sort_order)
  where approved_for_public and takedown_status='active';
create index if not exists event_images_public_idx on public.event_images(event_id,is_cover,sort_order)
  where approved_for_public and takedown_status='active';

drop policy if exists "Public place images" on public.place_images;
create policy "Public place images" on public.place_images for select using(
  approved_for_public and takedown_status='active'
  and (rights_expires_at is null or rights_expires_at>=current_date)
  and exists(select 1 from public.places p where p.id=place_id and p.publication_status='published')
);

drop policy if exists "Public read published event images" on public.event_images;
create policy "Public read published event images" on public.event_images for select using(
  approved_for_public and takedown_status='active'
  and (rights_expires_at is null or rights_expires_at>=current_date)
  and exists(select 1 from public.events e where e.id=event_id and e.publication_status='published')
);

commit;
