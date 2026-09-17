-- Phase 12: atomic special hours, Event images, and Event moderation.
begin;

create or replace function public.replace_place_special_hours(target_place_id uuid,items jsonb) returns void language plpgsql security definer set search_path=public as $$begin
  if not exists(select 1 from places p where p.id=target_place_id and is_business_editor(p.business_id)) then raise exception 'Business editor access required'; end if;
  if jsonb_typeof(items)<>'array' then raise exception 'Special hours must be an array'; end if;
  delete from place_special_hours where place_id=target_place_id;
  insert into place_special_hours(place_id,service_date,open_time,close_time,is_closed,crosses_midnight,note)
  select target_place_id,(x->>'serviceDate')::date,nullif(x->>'openTime','')::time,nullif(x->>'closeTime','')::time,coalesce((x->>'isClosed')::boolean,false),coalesce((x->>'crossesMidnight')::boolean,false),nullif(x->>'note','') from jsonb_array_elements(items)x;
end$$;
revoke all on function public.replace_place_special_hours(uuid,jsonb) from public;
grant execute on function public.replace_place_special_hours(uuid,jsonb) to authenticated;

create table if not exists public.event_images(
  id uuid primary key default gen_random_uuid(),event_id uuid not null references public.events(id) on delete cascade,
  image_url text not null,alt_text text,sort_order integer not null default 0,is_cover boolean not null default false,created_at timestamptz not null default now()
);
alter table public.event_images enable row level security;
drop policy if exists "Public read published event images" on public.event_images;
create policy "Public read published event images" on public.event_images for select using(exists(select 1 from public.events e where e.id=event_id and e.publication_status='published'));
drop policy if exists "Members manage event images" on public.event_images;
create policy "Members manage event images" on public.event_images for all to authenticated using(exists(select 1 from public.events e where e.id=event_id and public.is_business_editor(e.business_id))) with check(exists(select 1 from public.events e where e.id=event_id and public.is_business_editor(e.business_id)));

create table if not exists public.event_moderation_log(
  id uuid primary key default gen_random_uuid(),event_id uuid not null references public.events(id) on delete cascade,
  decision text not null check(decision in('approve','reject','archive','return_to_draft')),note text,moderated_by uuid not null,created_at timestamptz not null default now()
);
alter table public.event_moderation_log enable row level security;
drop policy if exists "Admins read event moderation log" on public.event_moderation_log;
create policy "Admins read event moderation log" on public.event_moderation_log for select to authenticated using(public.is_geppao_admin());

create or replace function public.moderate_event(target_event_id uuid,decision_name text,decision_note text default null) returns public.events language plpgsql security definer set search_path=public as $$declare updated_event public.events;begin
  if not public.is_geppao_admin() then raise exception 'Admin access required'; end if;
  if decision_name not in('approve','reject','archive','return_to_draft') then raise exception 'Invalid moderation decision'; end if;
  if decision_name='reject' and nullif(trim(decision_note),'') is null then raise exception 'Rejection note required'; end if;
  update events set publication_status=case decision_name when 'approve' then 'published' when 'reject' then 'rejected' when 'archive' then 'archived' else 'draft' end,
    verification_status=case decision_name when 'approve' then 'verified' when 'reject' then 'rejected' else verification_status end,
    last_verified_at=case when decision_name='approve' then now() else last_verified_at end,
    moderation_note=nullif(trim(decision_note),''),moderated_by=auth.uid(),moderated_at=now(),updated_at=now()
  where id=target_event_id returning * into updated_event;
  if updated_event.id is null then raise exception 'Event not found'; end if;
  insert into event_moderation_log(event_id,decision,note,moderated_by) values(target_event_id,decision_name,nullif(trim(decision_note),''),auth.uid());
  return updated_event;
end$$;
revoke all on function public.moderate_event(uuid,text,text) from public;
grant execute on function public.moderate_event(uuid,text,text) to authenticated;

drop policy if exists "Admins manage events" on public.events;
create policy "Admins manage events" on public.events for all to authenticated using(public.is_geppao_admin()) with check(public.is_geppao_admin());
drop policy if exists "Admins manage event schedules" on public.event_schedules;
create policy "Admins manage event schedules" on public.event_schedules for all to authenticated using(public.is_geppao_admin()) with check(public.is_geppao_admin());
drop policy if exists "Admins manage event images" on public.event_images;
create policy "Admins manage event images" on public.event_images for all to authenticated using(public.is_geppao_admin()) with check(public.is_geppao_admin());

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('event-images','event-images',true,8388608,array['image/jpeg','image/png','image/webp']::text[]) on conflict(id) do update set public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists "Public read event image objects" on storage.objects;
create policy "Public read event image objects" on storage.objects for select using(bucket_id='event-images');
drop policy if exists "Business editors upload event images" on storage.objects;
create policy "Business editors upload event images" on storage.objects for insert to authenticated with check(bucket_id='event-images' and exists(select 1 from public.events e where e.id::text=(storage.foldername(name))[2] and e.business_id::text=(storage.foldername(name))[1] and (public.is_business_editor(e.business_id) or public.is_geppao_admin())));
drop policy if exists "Business editors update event images" on storage.objects;
create policy "Business editors update event images" on storage.objects for update to authenticated using(bucket_id='event-images' and exists(select 1 from public.events e where e.id::text=(storage.foldername(name))[2] and e.business_id::text=(storage.foldername(name))[1] and (public.is_business_editor(e.business_id) or public.is_geppao_admin()))) with check(bucket_id='event-images');
drop policy if exists "Business editors delete event images" on storage.objects;
create policy "Business editors delete event images" on storage.objects for delete to authenticated using(bucket_id='event-images' and exists(select 1 from public.events e where e.id::text=(storage.foldername(name))[2] and e.business_id::text=(storage.foldername(name))[1] and (public.is_business_editor(e.business_id) or public.is_geppao_admin())));

commit;
