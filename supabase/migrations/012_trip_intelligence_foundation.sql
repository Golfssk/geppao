-- Phase 17: persisted schedule, route, validation, and budget intelligence.
-- This migration is additive and does not remove or rewrite existing Trip data.
begin;

alter table public.trip_items
  add column if not exists duration_minutes integer
    check (duration_minutes is null or duration_minutes > 0),
  add column if not exists travel_distance_km numeric
    check (travel_distance_km is null or travel_distance_km >= 0),
  add column if not exists travel_duration_minutes integer
    check (travel_duration_minutes is null or travel_duration_minutes >= 0),
  add column if not exists validation_status text not null default 'pending'
    check (validation_status in ('pending', 'valid', 'warning', 'conflict')),
  add column if not exists validation_messages jsonb not null default '[]'::jsonb;

alter table public.trip_days
  add column if not exists estimated_total_cost numeric not null default 0
    check (estimated_total_cost >= 0),
  add column if not exists estimated_travel_km numeric not null default 0
    check (estimated_travel_km >= 0),
  add column if not exists estimated_travel_minutes integer not null default 0
    check (estimated_travel_minutes >= 0),
  add column if not exists validation_status text not null default 'pending'
    check (validation_status in ('pending', 'valid', 'warning', 'conflict')),
  add column if not exists calculated_at timestamptz;

-- A composite key lets route segments prove that both endpoints belong to the same day.
create unique index if not exists trip_items_id_day_unique_idx
  on public.trip_items (id, trip_day_id);

create table if not exists public.route_segments(
  id uuid primary key default gen_random_uuid(),
  trip_day_id uuid not null references public.trip_days(id) on delete cascade,
  from_item_id uuid not null,
  to_item_id uuid not null,
  travel_mode text not null default 'driving'
    check (travel_mode in ('driving', 'walking', 'bicycling', 'transit')),
  distance_km numeric not null check (distance_km >= 0),
  duration_minutes integer not null check (duration_minutes >= 0),
  provider text not null check (provider in ('haversine', 'google_maps', 'manual')),
  confidence text not null default 'estimate'
    check (confidence in ('estimate', 'provider', 'confirmed')),
  calculated_at timestamptz not null default now(),
  expires_at timestamptz,
  constraint route_segments_distinct_items_check check (from_item_id <> to_item_id),
  unique (trip_day_id, from_item_id, to_item_id, travel_mode)
);

-- Remove older single-column foreign keys and the old unnamed check if this migration
-- is re-applied to a partially-created development database.
alter table public.route_segments
  drop constraint if exists route_segments_from_item_id_fkey,
  drop constraint if exists route_segments_to_item_id_fkey,
  drop constraint if exists route_segments_check;

-- CREATE TABLE IF NOT EXISTS does not add constraints to an existing table, so add
-- the distinct-endpoint constraint explicitly for databases with a prior table.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'route_segments_distinct_items_check'
      and conrelid = 'public.route_segments'::regclass
  ) then
    if exists (
      select 1
      from public.route_segments
      where from_item_id = to_item_id
    ) then
      raise exception 'Cannot add route_segments_distinct_items_check: duplicate endpoints exist';
    end if;

    alter table public.route_segments
      add constraint route_segments_distinct_items_check
      check (from_item_id <> to_item_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'route_segments_from_item_same_day_fkey'
      and conrelid = 'public.route_segments'::regclass
  ) then
    alter table public.route_segments
      add constraint route_segments_from_item_same_day_fkey
      foreign key (trip_day_id, from_item_id)
      references public.trip_items (trip_day_id, id)
      on delete cascade;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'route_segments_to_item_same_day_fkey'
      and conrelid = 'public.route_segments'::regclass
  ) then
    alter table public.route_segments
      add constraint route_segments_to_item_same_day_fkey
      foreign key (trip_day_id, to_item_id)
      references public.trip_items (trip_day_id, id)
      on delete cascade;
  end if;
end $$;

create index if not exists route_segments_day_idx
  on public.route_segments (trip_day_id);

alter table public.route_segments enable row level security;

drop policy if exists "Members read route segments" on public.route_segments;
create policy "Members read route segments"
  on public.route_segments
  for select to authenticated
  using (
    exists (
      select 1
      from public.trip_days d
      where d.id = trip_day_id
        and public.can_read_trip(d.trip_id)
    )
  );

drop policy if exists "Editors manage route segments" on public.route_segments;
create policy "Editors manage route segments"
  on public.route_segments
  for all to authenticated
  using (
    exists (
      select 1
      from public.trip_days d
      where d.id = trip_day_id
        and public.can_edit_trip(d.trip_id)
    )
  )
  with check (
    exists (
      select 1
      from public.trip_days d
      where d.id = trip_day_id
        and public.can_edit_trip(d.trip_id)
    )
  );

create or replace function public.refresh_trip_day_summary(target_trip_day_id uuid)
returns public.trip_days
language plpgsql
security definer
set search_path = public
as $$
declare
  target_trip_id uuid;
  updated_day public.trip_days;
begin
  select trip_id
    into target_trip_id
  from public.trip_days
  where id = target_trip_day_id;

  if target_trip_id is null then
    raise exception 'Trip day not found';
  end if;

  if not public.can_edit_trip(target_trip_id) then
    raise exception 'Trip editor access required';
  end if;

  update public.trip_days d
  set
    estimated_total_cost = coalesce(
      (select sum(i.estimated_cost)
       from public.trip_items i
       where i.trip_day_id = d.id),
      0
    ),
    estimated_travel_km = coalesce(
      (select sum(s.distance_km)
       from public.route_segments s
       where s.trip_day_id = d.id),
      0
    ),
    estimated_travel_minutes = coalesce(
      (select sum(s.duration_minutes)
       from public.route_segments s
       where s.trip_day_id = d.id),
      0
    ),
    validation_status = case
      when exists (
        select 1 from public.trip_items i
        where i.trip_day_id = d.id
          and i.validation_status = 'conflict'
      ) then 'conflict'
      when exists (
        select 1 from public.trip_items i
        where i.trip_day_id = d.id
          and i.validation_status in ('warning', 'pending')
      ) then 'warning'
      else 'valid'
    end,
    calculated_at = now()
  where d.id = target_trip_day_id
  returning d.* into updated_day;

  return updated_day;
end
$$;

revoke all on function public.refresh_trip_day_summary(uuid) from public;
grant execute on function public.refresh_trip_day_summary(uuid) to authenticated;

commit;
