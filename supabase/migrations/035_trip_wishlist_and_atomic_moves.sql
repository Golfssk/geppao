-- Free-only trip planning: private unscheduled stops and atomic cross-day moves.
-- Additive rollout. No existing itinerary rows are rewritten by this migration.
begin;
set local lock_timeout='5s';
set local statement_timeout='30s';

create table public.trip_wishlist(
 id uuid primary key default gen_random_uuid(),
 trip_id uuid not null references public.trips(id) on delete cascade,
 place_id uuid references public.places(id),
 event_id uuid references public.events(id),
 created_at timestamptz not null default now(),
 check ((place_id is not null)::integer+(event_id is not null)::integer=1)
);
create unique index trip_wishlist_place_unique on public.trip_wishlist(trip_id,place_id) where place_id is not null;
create unique index trip_wishlist_event_unique on public.trip_wishlist(trip_id,event_id) where event_id is not null;
alter table public.trip_wishlist enable row level security;
revoke all on public.trip_wishlist from public,anon,authenticated;
grant select on public.trip_wishlist to authenticated;
create policy "Members read private wishlist" on public.trip_wishlist for select to authenticated using(public.can_read_trip(trip_id));

-- Serialize our wishlist/move RPCs on the trip; never trust source/day IDs from a client.
create function public.save_trip_wishlist(target_trip_id uuid,source_place_id uuid default null,source_event_id uuid default null)
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare result_id uuid;
begin
 if auth.uid() is null or not public.can_edit_trip(target_trip_id) then raise exception 'Trip edit permission required' using errcode='42501'; end if;
 perform 1 from public.trips where id=target_trip_id for update;
 if (source_place_id is not null)::integer+(source_event_id is not null)::integer<>1 then raise exception 'One published source required' using errcode='22023'; end if;
 if not exists(select 1 from public.places where id=source_place_id and publication_status='published') and not exists(select 1 from public.events where id=source_event_id and publication_status='published') then raise exception 'Source is not published' using errcode='22023'; end if;
 insert into public.trip_wishlist(trip_id,place_id,event_id) values(target_trip_id,source_place_id,source_event_id) on conflict do nothing returning id into result_id;
 if result_id is null then select id into result_id from public.trip_wishlist where trip_id=target_trip_id and (place_id=source_place_id or event_id=source_event_id); end if;
 return result_id;
end $$;

create function public.remove_trip_wishlist(target_trip_id uuid,saved_stop_id uuid)
returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if auth.uid() is null or not public.can_edit_trip(target_trip_id) then raise exception 'Trip edit permission required' using errcode='42501'; end if;
 perform 1 from public.trips where id=target_trip_id for update;
 delete from public.trip_wishlist where id=saved_stop_id and trip_id=target_trip_id;
 return found;
end $$;

create function public.schedule_trip_wishlist(target_trip_id uuid,saved_stop_id uuid,target_day_id uuid)
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare saved public.trip_wishlist;result_id uuid;next_rank bigint;trip_currency text;
begin
 if auth.uid() is null or not public.can_edit_trip(target_trip_id) then raise exception 'Trip edit permission required' using errcode='42501'; end if;
 select currency into trip_currency from public.trips where id=target_trip_id for update;
 select * into saved from public.trip_wishlist where id=saved_stop_id and trip_id=target_trip_id for update;
 if not found then raise exception 'Saved stop changed; reload trip' using errcode='40001'; end if;
 if not exists(select 1 from public.trip_days where id=target_day_id and trip_id=target_trip_id) then raise exception 'Day does not belong to trip' using errcode='22023'; end if;
 if not exists(select 1 from public.places where id=saved.place_id and publication_status='published') and not exists(select 1 from public.events where id=saved.event_id and publication_status='published') then raise exception 'Source is not published' using errcode='22023'; end if;
 select coalesce(max(position)::bigint,-1024)+1024 into next_rank from public.trip_items where trip_day_id=target_day_id;
 if next_rank>2147483647 then raise exception 'Trip order limit reached' using errcode='22023'; end if;
 insert into public.trip_items(trip_day_id,place_id,event_id,position,currency,recommendation_reason) values(target_day_id,saved.place_id,saved.event_id,next_rank::integer,trip_currency,'เลือกจากถาดอยากไป') returning id into result_id;
 delete from public.trip_wishlist where id=saved.id;
 delete from public.route_segments where trip_day_id=target_day_id;
 update public.trip_items set travel_distance_km=null,travel_duration_minutes=null,validation_status='pending',validation_messages='[]' where trip_day_id=target_day_id;
 update public.trip_days set calculated_at=null,validation_status='pending' where id=target_day_id;
 update public.trips set updated_at=now() where id=target_trip_id;
 return result_id;
end $$;

create function public.move_trip_item(target_trip_id uuid,target_item_id uuid,expected_day_id uuid,target_day_id uuid)
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare item public.trip_items;next_rank bigint;
begin
 if auth.uid() is null or not public.can_edit_trip(target_trip_id) then raise exception 'Trip edit permission required' using errcode='42501'; end if;
 perform 1 from public.trips where id=target_trip_id for update;
 select i.* into item from public.trip_items i join public.trip_days d on d.id=i.trip_day_id where i.id=target_item_id and d.trip_id=target_trip_id for update of i;
 if not found or item.trip_day_id<>expected_day_id then raise exception 'Stop changed; reload trip' using errcode='40001'; end if;
 if item.is_locked then raise exception 'Unlock stop before moving' using errcode='55000'; end if;
 if not exists(select 1 from public.trip_days where id=target_day_id and trip_id=target_trip_id) then raise exception 'Day does not belong to trip' using errcode='22023'; end if;
 if target_day_id=item.trip_day_id then return item.id; end if;
 select coalesce(max(position)::bigint,-1024)+1024 into next_rank from public.trip_items where trip_day_id=target_day_id;
 if next_rank>2147483647 then raise exception 'Trip order limit reached' using errcode='22023'; end if;
 -- Delete stale same-day route endpoints in the SAME transaction, before changing the composite FK.
 delete from public.route_segments where trip_day_id in(item.trip_day_id,target_day_id);
 update public.trip_items set trip_day_id=target_day_id,position=next_rank::integer,starts_at=null,ends_at=null where id=item.id;
 update public.trip_items set travel_distance_km=null,travel_duration_minutes=null,validation_status='pending',validation_messages='[]' where trip_day_id in(item.trip_day_id,target_day_id);
 update public.trip_days set calculated_at=null,validation_status='pending' where id in(item.trip_day_id,target_day_id);
 update public.trips set updated_at=now() where id=target_trip_id;
 return item.id;
end $$;
revoke all on function public.save_trip_wishlist(uuid,uuid,uuid),public.remove_trip_wishlist(uuid,uuid),public.schedule_trip_wishlist(uuid,uuid,uuid),public.move_trip_item(uuid,uuid,uuid,uuid) from public,anon;
grant execute on function public.save_trip_wishlist(uuid,uuid,uuid),public.remove_trip_wishlist(uuid,uuid),public.schedule_trip_wishlist(uuid,uuid,uuid),public.move_trip_item(uuid,uuid,uuid,uuid) to authenticated;

-- Editors may plan, not transfer ownership or rotate the owner's public share link.
create function public.guard_trip_owner_fields() returns trigger language plpgsql set search_path=public,pg_temp as $$
begin
 if auth.uid() is not null then
  if new.id is distinct from old.id or new.owner_user_id is distinct from old.owner_user_id or new.created_at is distinct from old.created_at then raise exception 'Trip identity is immutable' using errcode='42501'; end if;
  if new.share_token is distinct from old.share_token and auth.uid()<>old.owner_user_id then raise exception 'Only owner can manage sharing' using errcode='42501'; end if;
 end if;
 return new;
end $$;
revoke all on function public.guard_trip_owner_fields() from public,anon,authenticated;
create trigger protect_trip_owner_fields before update on public.trips for each row execute function public.guard_trip_owner_fields();

-- Strict database-level public allowlist: no preferences, wishlist, notes, owner or future wallet.
create or replace function public.get_shared_trip(target_share_token uuid) returns jsonb language sql stable security definer set search_path=public,pg_temp as $$
 select jsonb_build_object('trip',jsonb_build_object('title',t.title,'start_date',t.start_date,'end_date',t.end_date,'travelers',t.travelers,'currency',t.currency),'days',coalesce((select jsonb_agg(jsonb_build_object('id',d.id,'dayNumber',d.day_number,'serviceDate',d.service_date,'title',d.title,'items',coalesce((select jsonb_agg(jsonb_build_object('id',i.id,'position',i.position,'startsAt',i.starts_at,'endsAt',i.ends_at,'estimatedCost',i.estimated_cost,'currency',i.currency,'place',case when p.publication_status='published' then jsonb_build_object('name',p.name,'slug',p.slug) end,'event',case when e.publication_status='published' then jsonb_build_object('name',e.name,'slug',e.slug) end) order by i.position,i.id) from public.trip_items i left join public.places p on p.id=i.place_id left join public.events e on e.id=i.event_id where i.trip_day_id=d.id),'[]'::jsonb)) order by d.day_number) from public.trip_days d where d.trip_id=t.id),'[]'::jsonb)) from public.trips t where t.share_token=target_share_token;
$$;
revoke all on function public.get_shared_trip(uuid) from public;
grant execute on function public.get_shared_trip(uuid) to anon,authenticated;
commit;
