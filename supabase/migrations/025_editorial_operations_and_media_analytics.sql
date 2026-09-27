-- Phase 2: editorial cover governance, managed storage, and privacy-safe media funnel analytics.
begin;

alter table public.articles
  add column if not exists cover_approved_by uuid references auth.users(id) on delete set null,
  add column if not exists cover_approved_at timestamptz;

alter table public.articles drop constraint if exists articles_cover_rights_check;
alter table public.articles add constraint articles_cover_rights_check check(
  cover_image_url is null
  or not cover_approved_for_public
  or (
    cover_image_url like '%/storage/v1/object/public/editorial-images/%'
    and nullif(trim(cover_alt_text),'') is not null
    and nullif(trim(cover_rights_holder),'') is not null
    and cover_rights_basis is not null
    and nullif(trim(cover_permission_evidence),'') is not null
    and cover_approved_by is not null
    and cover_approved_at is not null
  )
);

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('editorial-images','editorial-images',true,8388608,array['image/jpeg','image/png','image/webp']::text[])
on conflict(id) do update set
  public=excluded.public,
  file_size_limit=excluded.file_size_limit,
  allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists "Public read editorial image objects" on storage.objects;
create policy "Public read editorial image objects" on storage.objects
for select using(bucket_id='editorial-images');

drop policy if exists "Admins upload editorial images" on storage.objects;
create policy "Admins upload editorial images" on storage.objects
for insert to authenticated with check(
  bucket_id='editorial-images'
  and public.is_geppao_admin()
  and (storage.foldername(name))[1]='admin'
  and exists(select 1 from public.articles a where a.id::text=(storage.foldername(name))[2])
);

drop policy if exists "Admins update editorial images" on storage.objects;
create policy "Admins update editorial images" on storage.objects
for update to authenticated using(
  bucket_id='editorial-images' and public.is_geppao_admin() and (storage.foldername(name))[1]='admin'
) with check(
  bucket_id='editorial-images' and public.is_geppao_admin() and (storage.foldername(name))[1]='admin'
);

drop policy if exists "Admins delete editorial images" on storage.objects;
create policy "Admins delete editorial images" on storage.objects
for delete to authenticated using(
  bucket_id='editorial-images' and public.is_geppao_admin() and (storage.foldername(name))[1]='admin'
);

alter table public.product_analytics_events
  drop constraint if exists product_analytics_events_event_name_check;
alter table public.product_analytics_events
  add constraint product_analytics_events_event_name_check check(event_name in(
    'search','planner_run','planner_recommendation','trip_created',
    'add_to_trip','remove_from_trip','lock_item','unlock_item',
    'trip_recalculated','place_view','google_maps_opened','trip_shared',
    'contact_clicked','event_interest','article_view','story_to_destination',
    'story_to_planner','destination_view','affiliate_click',
    'sponsored_content_view','newsletter_signup'
  ));

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
set search_path=public
as $$
declare
  current_actor uuid := auth.uid();
  resolved_trip_id uuid := target_trip_id;
  safe_metadata jsonb;
  inserted_id uuid;
begin
  if requested_event_name not in(
    'search','planner_run','planner_recommendation','trip_created',
    'add_to_trip','remove_from_trip','lock_item','unlock_item',
    'trip_recalculated','place_view','google_maps_opened','trip_shared',
    'contact_clicked','event_interest','article_view','story_to_destination',
    'story_to_planner','destination_view','affiliate_click',
    'sponsored_content_view','newsletter_signup'
  ) then raise exception 'Unsupported analytics event'; end if;
  if requested_source not in('web','shared_trip','admin','business') then raise exception 'Unsupported analytics source'; end if;
  if current_actor is null and requested_anonymous_session_id is null then raise exception 'Anonymous session ID is required'; end if;
  if requested_path is not null and char_length(requested_path)>500 then raise exception 'Analytics path is too long'; end if;
  if jsonb_typeof(coalesce(requested_metadata,'{}'::jsonb))<>'object' then raise exception 'Analytics metadata must be an object'; end if;
  if target_trip_id is not null and target_share_token is not null then raise exception 'Use either trip ID or share token, not both'; end if;

  if target_trip_id is not null then
    if current_actor is null or not public.can_read_trip(target_trip_id) then raise exception 'Trip access denied'; end if;
  elsif target_share_token is not null then
    select t.id into resolved_trip_id from public.trips t where t.share_token=target_share_token;
    if resolved_trip_id is null then raise exception 'Shared trip not found'; end if;
  end if;
  if target_place_id is not null and not exists(select 1 from public.places p where p.id=target_place_id and p.publication_status='published') then raise exception 'Published Place not found'; end if;
  if target_event_id is not null and not exists(select 1 from public.events e where e.id=target_event_id and e.publication_status='published') then raise exception 'Published Event not found'; end if;
  if requested_event_name in('trip_created','add_to_trip','remove_from_trip','lock_item','unlock_item','trip_recalculated','trip_shared') and resolved_trip_id is null then raise exception 'Trip reference is required for this event'; end if;
  if requested_event_name in('place_view','contact_clicked') and target_place_id is null then raise exception 'Place reference is required for this event'; end if;
  if requested_event_name='event_interest' and target_event_id is null then raise exception 'Event reference is required for this event'; end if;
  if requested_event_name='planner_recommendation' and target_place_id is null and target_event_id is null then raise exception 'Place or Event reference is required for planner recommendation'; end if;
  if requested_event_name='google_maps_opened' and resolved_trip_id is null and target_place_id is null and target_event_id is null then raise exception 'Trip, Place, or Event reference is required for navigation'; end if;

  -- Keep bounded dimensions only. Never persist raw search/planner/newsletter text or contact details.
  safe_metadata := jsonb_strip_nulls(jsonb_build_object(
    'resultCount',case when requested_metadata?'resultCount' then greatest(0,least(10000,(requested_metadata->>'resultCount')::integer)) end,
    'travelers',case when requested_metadata?'travelers' then greatest(1,least(1000,(requested_metadata->>'travelers')::integer)) end,
    'hasBudget',case when requested_metadata?'hasBudget' then (requested_metadata->>'hasBudget')::boolean end,
    'itemCount',case when requested_metadata?'itemCount' then greatest(0,least(1000,(requested_metadata->>'itemCount')::integer)) end,
    'dayCount',case when requested_metadata?'dayCount' then greatest(0,least(365,(requested_metadata->>'dayCount')::integer)) end,
    'queryLength',case when requested_metadata?'queryLength' then greatest(0,least(10000,(requested_metadata->>'queryLength')::integer)) end,
    'placeType',case when requested_metadata?'placeType' then left(requested_metadata->>'placeType',50) end,
    'action',case when requested_metadata?'action' then left(requested_metadata->>'action',50) end,
    'outcome',case when requested_metadata?'outcome' then left(requested_metadata->>'outcome',50) end,
    'errorCode',case when requested_metadata?'errorCode' then left(requested_metadata->>'errorCode',100) end,
    'articleSlug',case when requested_metadata?'articleSlug' then left(requested_metadata->>'articleSlug',180) end,
    'destinationSlug',case when requested_metadata?'destinationSlug' then left(requested_metadata->>'destinationSlug',180) end,
    'category',case when requested_metadata?'category' then left(requested_metadata->>'category',40) end,
    'commercialType',case when requested_metadata?'commercialType' then left(requested_metadata->>'commercialType',20) end,
    'linkType',case when requested_metadata?'linkType' then left(requested_metadata->>'linkType',30) end,
    'placement',case when requested_metadata?'placement' then left(requested_metadata->>'placement',50) end
  ));

  insert into public.product_analytics_events(
    event_name,actor_user_id,anonymous_session_id,trip_id,place_id,event_id,source,path,metadata
  ) values(
    requested_event_name,current_actor,requested_anonymous_session_id,resolved_trip_id,
    target_place_id,target_event_id,requested_source,requested_path,safe_metadata
  ) returning id into inserted_id;
  return inserted_id;
end;
$$;

revoke all on function public.track_product_event(text,uuid,uuid,uuid,uuid,uuid,text,text,jsonb) from public;
grant execute on function public.track_product_event(text,uuid,uuid,uuid,uuid,uuid,text,text,jsonb) to anon,authenticated;

commit;