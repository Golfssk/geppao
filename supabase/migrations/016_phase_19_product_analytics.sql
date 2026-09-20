-- Phase 19: privacy-safe product analytics foundation.
-- Additive migration. It does not modify or publish Local Data.

begin;

create table if not exists public.product_analytics_events (
  id uuid primary key default gen_random_uuid(),
  occurred_at timestamptz not null default now(),
  event_name text not null check (event_name in (
    'search',
    'planner_run',
    'planner_recommendation',
    'trip_created',
    'add_to_trip',
    'remove_from_trip',
    'lock_item',
    'unlock_item',
    'trip_recalculated',
    'place_view',
    'google_maps_opened',
    'trip_shared',
    'contact_clicked',
    'event_interest'
  )),
  actor_user_id uuid references auth.users(id) on delete set null,
  anonymous_session_id uuid,
  trip_id uuid references public.trips(id) on delete set null,
  place_id uuid references public.places(id) on delete set null,
  event_id uuid references public.events(id) on delete set null,
  source text not null default 'web' check (source in ('web', 'shared_trip', 'admin', 'business')),
  path text check (path is null or char_length(path) <= 500),
  metadata jsonb not null default '{}'::jsonb,
  constraint product_analytics_actor_check check (
    actor_user_id is not null or anonymous_session_id is not null
  ),
  constraint product_analytics_metadata_object_check check (
    jsonb_typeof(metadata) = 'object'
  ),
  constraint product_analytics_metadata_size_check check (
    octet_length(metadata::text) <= 4096
  )
);

create index if not exists product_analytics_occurred_idx
  on public.product_analytics_events(occurred_at desc);
create index if not exists product_analytics_name_occurred_idx
  on public.product_analytics_events(event_name, occurred_at desc);
create index if not exists product_analytics_place_occurred_idx
  on public.product_analytics_events(place_id, occurred_at desc)
  where place_id is not null;
create index if not exists product_analytics_trip_occurred_idx
  on public.product_analytics_events(trip_id, occurred_at desc)
  where trip_id is not null;

alter table public.product_analytics_events enable row level security;

create policy "Admins read product analytics"
on public.product_analytics_events
for select
to authenticated
using (public.is_geppao_admin());

create or replace function public.track_product_event(
  requested_event_name text,
  requested_anonymous_session_id uuid default null,
  target_trip_id uuid default null,
  target_share_token uuid default null,
  target_place_id uuid default null,
  target_event_id uuid default null,
  requested_source text default 'web',
  requested_path text default null,
  requested_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_actor uuid := auth.uid();
  resolved_trip_id uuid := target_trip_id;
  safe_metadata jsonb;
  inserted_id uuid;
begin
  if requested_event_name not in (
    'search', 'planner_run', 'planner_recommendation', 'trip_created',
    'add_to_trip', 'remove_from_trip', 'lock_item', 'unlock_item',
    'trip_recalculated', 'place_view', 'google_maps_opened', 'trip_shared',
    'contact_clicked', 'event_interest'
  ) then
    raise exception 'Unsupported analytics event';
  end if;

  if requested_source not in ('web', 'shared_trip', 'admin', 'business') then
    raise exception 'Unsupported analytics source';
  end if;

  if current_actor is null and requested_anonymous_session_id is null then
    raise exception 'Anonymous session ID is required';
  end if;

  if requested_path is not null and char_length(requested_path) > 500 then
    raise exception 'Analytics path is too long';
  end if;

  if jsonb_typeof(coalesce(requested_metadata, '{}'::jsonb)) <> 'object' then
    raise exception 'Analytics metadata must be an object';
  end if;

  if target_trip_id is not null and target_share_token is not null then
    raise exception 'Use either trip ID or share token, not both';
  end if;

  if target_trip_id is not null then
    if current_actor is null or not public.can_read_trip(target_trip_id) then
      raise exception 'Trip access denied';
    end if;
  elsif target_share_token is not null then
    select t.id into resolved_trip_id
    from public.trips t
    where t.share_token = target_share_token;

    if resolved_trip_id is null then
      raise exception 'Shared trip not found';
    end if;
  end if;

  if target_place_id is not null and not exists (
    select 1 from public.places p
    where p.id = target_place_id and p.publication_status = 'published'
  ) then
    raise exception 'Published Place not found';
  end if;

  if target_event_id is not null and not exists (
    select 1 from public.events e
    where e.id = target_event_id and e.publication_status = 'published'
  ) then
    raise exception 'Published Event not found';
  end if;

  if requested_event_name in (
    'trip_created', 'add_to_trip', 'remove_from_trip', 'lock_item',
    'unlock_item', 'trip_recalculated', 'trip_shared'
  ) and resolved_trip_id is null then
    raise exception 'Trip reference is required for this event';
  end if;

  if requested_event_name in ('place_view', 'contact_clicked')
     and target_place_id is null then
    raise exception 'Place reference is required for this event';
  end if;

  if requested_event_name = 'event_interest' and target_event_id is null then
    raise exception 'Event reference is required for this event';
  end if;

  if requested_event_name = 'planner_recommendation'
     and target_place_id is null and target_event_id is null then
    raise exception 'Place or Event reference is required for planner recommendation';
  end if;

  if requested_event_name = 'google_maps_opened'
     and resolved_trip_id is null and target_place_id is null and target_event_id is null then
    raise exception 'Trip, Place, or Event reference is required for navigation';
  end if;

  -- Keep only bounded, non-PII analytics dimensions. Raw search/planner text is never stored.
  safe_metadata := jsonb_strip_nulls(jsonb_build_object(
    'resultCount', case when requested_metadata ? 'resultCount'
      then greatest(0, least(10000, (requested_metadata->>'resultCount')::integer)) end,
    'travelers', case when requested_metadata ? 'travelers'
      then greatest(1, least(1000, (requested_metadata->>'travelers')::integer)) end,
    'hasBudget', case when requested_metadata ? 'hasBudget'
      then (requested_metadata->>'hasBudget')::boolean end,
    'itemCount', case when requested_metadata ? 'itemCount'
      then greatest(0, least(1000, (requested_metadata->>'itemCount')::integer)) end,
    'dayCount', case when requested_metadata ? 'dayCount'
      then greatest(0, least(365, (requested_metadata->>'dayCount')::integer)) end,
    'queryLength', case when requested_metadata ? 'queryLength'
      then greatest(0, least(10000, (requested_metadata->>'queryLength')::integer)) end,
    'placeType', case when requested_metadata ? 'placeType'
      then left(requested_metadata->>'placeType', 50) end,
    'action', case when requested_metadata ? 'action'
      then left(requested_metadata->>'action', 50) end,
    'outcome', case when requested_metadata ? 'outcome'
      then left(requested_metadata->>'outcome', 50) end,
    'errorCode', case when requested_metadata ? 'errorCode'
      then left(requested_metadata->>'errorCode', 100) end
  ));

  insert into public.product_analytics_events(
    event_name,
    actor_user_id,
    anonymous_session_id,
    trip_id,
    place_id,
    event_id,
    source,
    path,
    metadata
  ) values (
    requested_event_name,
    current_actor,
    requested_anonymous_session_id,
    resolved_trip_id,
    target_place_id,
    target_event_id,
    requested_source,
    requested_path,
    safe_metadata
  )
  returning id into inserted_id;

  return inserted_id;
end;
$$;

revoke all on function public.track_product_event(text, uuid, uuid, uuid, uuid, uuid, text, text, jsonb) from public;
grant execute on function public.track_product_event(text, uuid, uuid, uuid, uuid, uuid, text, text, jsonb) to anon, authenticated;

create or replace function public.get_product_analytics_summary(window_days integer default 30)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  from_time timestamptz;
  planner_runs bigint;
  trips_created bigint;
  result jsonb;
begin
  if not public.is_geppao_admin() then
    raise exception 'Admin access required';
  end if;

  if window_days < 1 or window_days > 365 then
    raise exception 'Analytics window must be between 1 and 365 days';
  end if;

  from_time := now() - make_interval(days => window_days);

  select count(*) into planner_runs
  from public.product_analytics_events
  where occurred_at >= from_time and event_name = 'planner_run';

  select count(*) into trips_created
  from public.product_analytics_events
  where occurred_at >= from_time and event_name = 'trip_created';

  select jsonb_build_object(
    'windowDays', window_days,
    'from', from_time,
    'generatedAt', now(),
    'totals', jsonb_build_object(
      'events', (select count(*) from public.product_analytics_events where occurred_at >= from_time),
      'uniqueActors', (
        select count(distinct coalesce(actor_user_id::text, anonymous_session_id::text))
        from public.product_analytics_events
        where occurred_at >= from_time
      ),
      'searches', (select count(*) from public.product_analytics_events where occurred_at >= from_time and event_name = 'search'),
      'plannerRuns', planner_runs,
      'tripsCreated', trips_created,
      'navigationOpens', (select count(*) from public.product_analytics_events where occurred_at >= from_time and event_name = 'google_maps_opened'),
      'tripShares', (select count(*) from public.product_analytics_events where occurred_at >= from_time and event_name = 'trip_shared'),
      'plannerToTripPercent', case when planner_runs = 0 then 0 else round(trips_created::numeric / planner_runs::numeric * 100, 1) end
    ),
    'eventCounts', coalesce((
      select jsonb_object_agg(grouped.event_name, grouped.event_count)
      from (
        select event_name, count(*) as event_count
        from public.product_analytics_events
        where occurred_at >= from_time
        group by event_name
        order by event_name
      ) grouped
    ), '{}'::jsonb),
    'daily', coalesce((
      select jsonb_agg(jsonb_build_object(
        'date', grouped.event_date,
        'events', grouped.event_count,
        'uniqueActors', grouped.unique_actors
      ) order by grouped.event_date)
      from (
        select occurred_at::date as event_date,
               count(*) as event_count,
               count(distinct coalesce(actor_user_id::text, anonymous_session_id::text)) as unique_actors
        from public.product_analytics_events
        where occurred_at >= from_time
        group by occurred_at::date
      ) grouped
    ), '[]'::jsonb),
    'topPlaces', coalesce((
      select jsonb_agg(jsonb_build_object(
        'placeId', grouped.place_id,
        'name', grouped.name,
        'engagements', grouped.engagement_count
      ) order by grouped.engagement_count desc, grouped.name)
      from (
        select p.id as place_id, p.name, count(*) as engagement_count
        from public.product_analytics_events analytics
        join public.places p on p.id = analytics.place_id
        where analytics.occurred_at >= from_time
        group by p.id, p.name
        order by engagement_count desc, p.name
        limit 10
      ) grouped
    ), '[]'::jsonb)
  ) into result;

  return result;
end;
$$;

revoke all on function public.get_product_analytics_summary(integer) from public;
grant execute on function public.get_product_analytics_summary(integer) to authenticated;

commit;
