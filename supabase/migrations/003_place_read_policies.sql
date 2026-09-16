-- Phase 8 public read policies for published Local Data.
begin;
alter table public.tags enable row level security;
alter table public.place_tags enable row level security;
alter table public.place_relationships enable row level security;
alter table public.place_sources enable row level security;

drop policy if exists "Public active businesses" on public.businesses;
create policy "Public active businesses" on public.businesses for select using(status='active');

drop policy if exists "Public place images" on public.place_images;
create policy "Public place images" on public.place_images for select using(exists(select 1 from public.places p where p.id=place_id and p.publication_status='published'));
drop policy if exists "Public place hours" on public.place_hours;
create policy "Public place hours" on public.place_hours for select using(exists(select 1 from public.places p where p.id=place_id and p.publication_status='published'));
drop policy if exists "Public place special hours" on public.place_special_hours;
create policy "Public place special hours" on public.place_special_hours for select using(exists(select 1 from public.places p where p.id=place_id and p.publication_status='published'));
drop policy if exists "Public place prices" on public.price_items;
create policy "Public place prices" on public.price_items for select using((place_id is not null and exists(select 1 from public.places p where p.id=place_id and p.publication_status='published')) or(event_id is not null and exists(select 1 from public.events e where e.id=event_id and e.publication_status='published')));
drop policy if exists "Public event schedules" on public.event_schedules;
create policy "Public event schedules" on public.event_schedules for select using(exists(select 1 from public.events e where e.id=event_id and e.publication_status='published'));
drop policy if exists "Public tags" on public.tags;
create policy "Public tags" on public.tags for select using(true);
drop policy if exists "Public place tags" on public.place_tags;
create policy "Public place tags" on public.place_tags for select using(exists(select 1 from public.places p where p.id=place_id and p.publication_status='published'));
drop policy if exists "Public place relationships" on public.place_relationships;
create policy "Public place relationships" on public.place_relationships for select using(exists(select 1 from public.places p where p.id=from_place_id and p.publication_status='published'));
commit;
