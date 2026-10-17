-- Atomic ordering only. It does not claim to version legacy schedule/recalculation writes.
create or replace function public.arrange_trip_item(
 target_trip_id uuid,target_item_id uuid,source_day_id uuid,target_day_id uuid,
 before_item_id uuid,expected_days jsonb
) returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare d uuid; actual jsonb; expected jsonb; ids uuid[]; old_ids uuid[]; at_index integer; locked_id uuid;
begin
 if auth.uid() is null or not public.can_edit_trip(target_trip_id) then raise exception 'Edit access required' using errcode='42501'; end if;
 perform 1 from public.trips where id=target_trip_id for update;
 if source_day_id is null or target_day_id is null or target_item_id is null or jsonb_typeof(expected_days) is distinct from 'array' or jsonb_array_length(expected_days)<>(case when source_day_id=target_day_id then 1 else 2 end) then raise exception 'Invalid snapshot' using errcode='22023'; end if;
 if (select count(distinct (s->>'dayId')::uuid) from jsonb_array_elements(expected_days) s)<>jsonb_array_length(expected_days) then raise exception 'Duplicate day' using errcode='22023'; end if;
 -- Lock the involved day and item rows in stable order; no delete/reinsert of user stops.
 for d in select distinct v from unnest(array[source_day_id,target_day_id]) v order by v loop
  perform 1 from public.trip_days where id=d and trip_id=target_trip_id for update;
  if not found then raise exception 'Day unavailable' using errcode='22023'; end if;
  perform 1 from public.trip_items where trip_day_id=d order by id for update;
  select coalesce(jsonb_agg(jsonb_build_object('id',id,'position',position,'locked',is_locked) order by position,id),'[]'::jsonb) into actual from public.trip_items where trip_day_id=d;
  select s->'items' into expected from jsonb_array_elements(expected_days) s where (s->>'dayId')::uuid=d;
  if jsonb_array_length(actual)>100 or expected is distinct from actual then raise exception 'Order changed; reload' using errcode='40001'; end if;
 end loop;
 if (select count(*) from public.trip_items where trip_day_id in(source_day_id,target_day_id))>100 then raise exception 'Too many stops' using errcode='22023'; end if;
 perform 1 from public.trip_items where id=target_item_id and trip_day_id=source_day_id;
 if not found then raise exception 'Stop moved; reload' using errcode='40001'; end if;
 if (select is_locked from public.trip_items where id=target_item_id) then raise exception 'Locked stop' using errcode='55000'; end if;
 if before_item_id=target_item_id then return target_item_id; end if;
 if before_item_id is not null and not exists(select 1 from public.trip_items where id=before_item_id and trip_day_id=target_day_id) then raise exception 'Drop target unavailable' using errcode='40001'; end if;
 select array_agg(id order by position,id) into old_ids from public.trip_items where trip_day_id=target_day_id;
 select coalesce(array_agg(id order by position,id),array[]::uuid[]) into ids from public.trip_items where trip_day_id=target_day_id and id<>target_item_id;
 at_index=case when before_item_id is null then cardinality(ids)+1 else array_position(ids,before_item_id) end;
 ids=coalesce(ids[1:at_index-1],array[]::uuid[])||array[target_item_id]||coalesce(ids[at_index:cardinality(ids)],array[]::uuid[]);
 -- Same-day locks are anchors: an unlocked stop may not cross one.
 if source_day_id=target_day_id then
  for locked_id in select id from public.trip_items where trip_day_id=target_day_id and is_locked loop
   if array_position(old_ids,locked_id)<>array_position(ids,locked_id) then raise exception 'Cannot cross locked stop' using errcode='55000'; end if;
  end loop;
  if ids=old_ids then return target_item_id; end if;
 else
  -- Existing atomic move clears old time windows, preserves notes/cost/duration and invalidates both days.
  perform public.move_trip_item(target_trip_id,target_item_id,source_day_id,target_day_id);
 end if;
 delete from public.route_segments where trip_day_id in(source_day_id,target_day_id);
 update public.trip_items i set position=(o.ordinality::integer-1)*1024 from unnest(ids) with ordinality o(id,ordinality) where i.id=o.id and i.trip_day_id=target_day_id;
 update public.trip_items set travel_distance_km=null,travel_duration_minutes=null,validation_status='pending',validation_messages='[]'::jsonb where trip_day_id in(source_day_id,target_day_id);
 update public.trip_days set calculated_at=null,validation_status='pending' where id in(source_day_id,target_day_id);
 update public.trips set updated_at=now() where id=target_trip_id;
 return target_item_id;
end $$;
revoke all on function public.arrange_trip_item(uuid,uuid,uuid,uuid,uuid,jsonb) from public,anon;
grant execute on function public.arrange_trip_item(uuid,uuid,uuid,uuid,uuid,jsonb) to authenticated;
