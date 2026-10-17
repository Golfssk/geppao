-- Itinerary writes lock the parent first. Missing/stale revisions fail closed.
alter table public.trips add column plan_revision bigint not null default 1;
alter table public.trip_items add column cost_is_manual boolean not null default true;
alter table public.trip_items add column duration_is_manual boolean not null default true;

create function public.guard_plan_revision() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if tg_op='INSERT' then new.plan_revision:=1;
 elsif pg_trigger_depth()>1 then new.plan_revision:=old.plan_revision+1;
 elsif row(new.title,new.start_date,new.end_date,new.travelers,new.budget_total,new.preferences,new.destination_id,new.currency,new.status)
 is distinct from row(old.title,old.start_date,old.end_date,old.travelers,old.budget_total,old.preferences,old.destination_id,old.currency,old.status)
 then new.plan_revision:=old.plan_revision+1;
 else new.plan_revision:=old.plan_revision; end if;
 return new;
end $$;
create trigger trip_plan_revision before insert or update on public.trips for each row execute function public.guard_plan_revision();
create function public.bump_trip_plan_revision() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare tid uuid; did uuid;
begin
 if tg_table_name='trip_days' then
  if tg_op='DELETE' then tid:=old.trip_id; else tid:=new.trip_id; end if;
 else
  if tg_op='DELETE' then did:=old.trip_day_id; else did:=new.trip_day_id; end if;
  select trip_id into tid from trip_days where id=did;
 end if;
 update trips set plan_revision=plan_revision+1 where id=tid;
 return null;
end $$;
create trigger trip_item_revision after insert or update or delete on public.trip_items for each row execute function public.bump_trip_plan_revision();
create trigger trip_day_revision after insert or update or delete on public.trip_days for each row execute function public.bump_trip_plan_revision();

create function public.lock_trip_plan(target_trip_id uuid,expected_revision bigint) returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare revision bigint;
begin
 if auth.uid() is null or not can_edit_trip(target_trip_id) then raise exception 'Not permitted' using errcode='42501'; end if;
 select plan_revision into revision from trips where id=target_trip_id for update;
 if revision is null then raise exception 'Not permitted' using errcode='42501'; end if;
 if expected_revision is null or revision<>expected_revision then raise exception 'Plan changed. Reload before saving.' using errcode='40001'; end if;
end $$;
create function public.invalidate_trip_plan(target_day_ids uuid[]) returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
 delete from route_segments where trip_day_id=any(target_day_ids);
 update trip_items set travel_distance_km=null,travel_duration_minutes=null,validation_status='pending',validation_messages='[]' where trip_day_id=any(target_day_ids);
 update trip_days set calculated_at=null,validation_status='pending',estimated_total_cost=0,estimated_travel_km=0,estimated_travel_minutes=0 where id=any(target_day_ids);
end $$;

create function public.mutate_trip_item(target_trip_id uuid,expected_revision bigint,action text,payload jsonb) returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare i trip_items; did uuid; pid uuid; eid uuid; result uuid; start_time timestamptz; end_time timestamptz; cost numeric; duration int; k text;
begin
 perform lock_trip_plan(target_trip_id,expected_revision);
 if jsonb_typeof(payload)<>'object' then raise exception 'Invalid payload' using errcode='22023'; end if;
 if action='add' then
  did:=(payload->>'tripDayId')::uuid; pid:=(payload->>'placeId')::uuid; eid:=(payload->>'eventId')::uuid;
  if not exists(select 1 from trip_days where id=did and trip_id=target_trip_id) or (pid is null)=(eid is null) then raise exception 'Invalid source/day' using errcode='22023'; end if;
  if pid is not null and not exists(select 1 from places where id=pid and publication_status='published') or eid is not null and not exists(select 1 from events where id=eid and publication_status='published') then raise exception 'Source unavailable' using errcode='22023'; end if;
  if (select count(*) from trip_items x join trip_days d on d.id=x.trip_day_id where d.trip_id=target_trip_id)>=100 then raise exception 'Stop limit' using errcode='22023'; end if;
  cost:=(payload->>'estimatedCost')::numeric;
  if cost<0 or cost>1000000000 or cost::text in ('NaN','Infinity','-Infinity') then raise exception 'Invalid cost' using errcode='22023'; end if;
  insert into trip_items(trip_day_id,place_id,event_id,position,estimated_cost,cost_is_manual,duration_is_manual,recommendation_reason)
  select did,pid,eid,coalesce(max(position)::bigint+1024,0)::int,cost,cost is not null,false,'เลือกจากสถานที่เผยแพร่' from trip_items where trip_day_id=did returning id into result;
 elsif action in ('patch','delete') then
  select x.* into i from trip_items x join trip_days d on d.id=x.trip_day_id where x.id=(payload->>'itemId')::uuid and d.trip_id=target_trip_id for update of x;
  if i.id is null then raise exception 'Item unavailable' using errcode='22023'; end if;
  did:=i.trip_day_id; result:=i.id;
  if i.is_locked and (action='delete' or exists(select 1 from jsonb_object_keys(payload) x where x not in ('itemId','isLocked','expectedVersion'))) then raise exception 'Locked stop' using errcode='55000'; end if;
  if action='delete' then delete from trip_items where id=i.id;
  else
   for k in select jsonb_object_keys(payload) loop if k not in ('itemId','isLocked','notes','startsAt','endsAt','durationMinutes','estimatedCost','expectedVersion') then raise exception 'Unknown field' using errcode='22023'; end if; end loop;
   if payload ? 'notes' and (jsonb_typeof(payload->'notes')<>'string' or length(payload->>'notes')>2000) or payload ? 'isLocked' and jsonb_typeof(payload->'isLocked')<>'boolean' then raise exception 'Invalid field' using errcode='22023'; end if;
   start_time:=case when payload ? 'startsAt' then (payload->>'startsAt')::timestamptz else i.starts_at end;
   end_time:=case when payload ? 'endsAt' then (payload->>'endsAt')::timestamptz else i.ends_at end;
   duration:=case when payload ? 'durationMinutes' then (payload->>'durationMinutes')::int else i.duration_minutes end;
   cost:=case when payload ? 'estimatedCost' then (payload->>'estimatedCost')::numeric else i.estimated_cost end;
   if not isfinite(start_time) or not isfinite(end_time) or start_time>=end_time or duration not between 1 and 1440 or cost<0 or cost>1000000000 or cost::text in ('NaN','Infinity','-Infinity') or payload ? 'durationMinutes' and duration is null then raise exception 'Invalid time/cost' using errcode='22023'; end if;
   update trip_items set starts_at=start_time,ends_at=end_time,duration_minutes=duration,estimated_cost=cost,
    duration_is_manual=case when payload ? 'durationMinutes' then true else duration_is_manual end,
    cost_is_manual=case when payload ? 'estimatedCost' then cost is not null else cost_is_manual end,
    notes=case when payload ? 'notes' then payload->>'notes' else notes end,
    is_locked=case when payload ? 'isLocked' then (payload->>'isLocked')::boolean else is_locked end where id=i.id;
  end if;
 else raise exception 'Unknown action' using errcode='22023'; end if;
 perform invalidate_trip_plan(array[did]);
 return result;
end $$;

create function public.arrange_trip_item_versioned(target_trip_id uuid,expected_revision bigint,target_item_id uuid,source_day_id uuid,target_day_id uuid,before_item_id uuid,expected_days jsonb) returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
begin perform lock_trip_plan(target_trip_id,expected_revision); return arrange_trip_item(target_trip_id,target_item_id,source_day_id,target_day_id,before_item_id,expected_days); end $$;
create function public.move_trip_item_versioned(target_trip_id uuid,expected_revision bigint,target_item_id uuid,expected_day_id uuid,target_day_id uuid) returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
begin perform lock_trip_plan(target_trip_id,expected_revision); return move_trip_item(target_trip_id,target_item_id,expected_day_id,target_day_id); end $$;
create function public.schedule_trip_wishlist_versioned(target_trip_id uuid,expected_revision bigint,saved_stop_id uuid,target_day_id uuid) returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare result uuid;
begin perform lock_trip_plan(target_trip_id,expected_revision); if (select count(*) from trip_items i join trip_days d on d.id=i.trip_day_id where d.trip_id=target_trip_id)>=100 then raise exception 'Stop limit' using errcode='22023'; end if; result:=schedule_trip_wishlist(target_trip_id,saved_stop_id,target_day_id); update trip_items set cost_is_manual=false,duration_is_manual=false where id=result; return result; end $$;

create function public.trip_plan_options(target_trip_id uuid) returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$
declare result jsonb;
begin
 if auth.uid() is null or not can_edit_trip(target_trip_id) then raise exception 'Not permitted' using errcode='42501'; end if;
 select jsonb_build_object('expectedVersion',t.plan_revision,'days',coalesce((select jsonb_agg(jsonb_build_object('id',d.id,'day_number',d.day_number,'service_date',d.service_date) order by d.day_number) from trip_days d where d.trip_id=t.id),'[]'::jsonb)) into result from trips t where t.id=target_trip_id;
 return result;
end $$;

create function public.seed_trip_plan(target_trip_id uuid,expected_revision bigint,plan_items jsonb) returns bigint language plpgsql security definer set search_path=public,pg_temp as $$
declare x jsonb; did uuid; pid uuid; eid uuid;
begin
 perform lock_trip_plan(target_trip_id,expected_revision);
 perform 1 from trips where id=target_trip_id and owner_user_id=auth.uid() for update;
 if not found or auth.uid() is null then raise exception 'Not permitted' using errcode='42501'; end if;
 if exists(select 1 from trip_items i join trip_days d on d.id=i.trip_day_id where d.trip_id=target_trip_id) then raise exception 'Plan already populated' using errcode='40001'; end if;
 if jsonb_typeof(plan_items)<>'array' or jsonb_array_length(plan_items) not between 1 and 100 then raise exception 'Invalid items' using errcode='22023'; end if;
 for x in select value from jsonb_array_elements(plan_items) loop
  did:=(x->>'trip_day_id')::uuid; pid:=(x->>'place_id')::uuid; eid:=(x->>'event_id')::uuid;
  if not exists(select 1 from trip_days where id=did and trip_id=target_trip_id) or (pid is null)=(eid is null) then raise exception 'Invalid source/day' using errcode='22023'; end if;
  if pid is not null and not exists(select 1 from places where id=pid and publication_status='published') or eid is not null and not exists(select 1 from events where id=eid and publication_status='published') then raise exception 'Source unavailable' using errcode='22023'; end if;
  if (x->>'duration_minutes')::numeric not between 1 and 1440 or (x->>'estimated_cost')::numeric not between 0 and 1000000000 or length(x->>'recommendation_reason')>2000 or (x->>'starts_at')::timestamptz>=(x->>'ends_at')::timestamptz then raise exception 'Invalid item values' using errcode='22023'; end if;
  insert into trip_items(trip_day_id,place_id,event_id,position,starts_at,ends_at,duration_minutes,estimated_cost,recommendation_reason,cost_is_manual,duration_is_manual)
   values(did,pid,eid,(x->>'position')::int,(x->>'starts_at')::timestamptz,(x->>'ends_at')::timestamptz,(x->>'duration_minutes')::int,(x->>'estimated_cost')::numeric,x->>'recommendation_reason',false,false);
 end loop;
 return (select plan_revision from trips where id=target_trip_id);
end $$;

-- One statement snapshot; only published planning facts are returned, never private listing fields.
create function public.trip_calculation_snapshot(target_trip_id uuid) returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$
declare snapshot jsonb;
begin
 if auth.uid() is null or not can_edit_trip(target_trip_id) then raise exception 'Not permitted' using errcode='42501'; end if;
 select jsonb_build_object('trip',jsonb_build_object('id',t.id,'plan_revision',t.plan_revision,'travelers',t.travelers,'start_date',t.start_date,'end_date',t.end_date,'preferences',t.preferences),
 'days',coalesce((select jsonb_agg(jsonb_build_object('id',d.id,'day_number',d.day_number,'service_date',d.service_date) order by d.day_number) from trip_days d where d.trip_id=t.id),'[]'::jsonb),
 'items',coalesce((select jsonb_agg(to_jsonb(i)||jsonb_build_object('place',case when p.id is null then null when p.publication_status<>'published' then jsonb_build_object('id',p.id,'publication_status',p.publication_status) else
 jsonb_build_object('id',p.id,'name',p.name,'latitude',p.latitude,'longitude',p.longitude,'publication_status',p.publication_status,'recommended_duration_minutes',p.recommended_duration_minutes,
 'place_hours',coalesce((select jsonb_agg(jsonb_build_object('day_of_week',h.day_of_week,'open_time',h.open_time,'close_time',h.close_time,'is_closed',h.is_closed,'crosses_midnight',h.crosses_midnight) order by h.day_of_week,h.id) from place_hours h where h.place_id=p.id),'[]'::jsonb),
 'place_special_hours',coalesce((select jsonb_agg(jsonb_build_object('service_date',h.service_date,'open_time',h.open_time,'close_time',h.close_time,'is_closed',h.is_closed) order by h.service_date,h.id) from place_special_hours h where h.place_id=p.id),'[]'::jsonb),
 'price_items',coalesce((select jsonb_agg(jsonb_build_object('amount_min',v.amount_min,'price_unit',v.price_unit,'is_estimate',v.is_estimate) order by v.id) from price_items v where v.place_id=p.id),'[]'::jsonb)) end,
 'event',case when e.id is null then null when e.publication_status<>'published' then jsonb_build_object('id',e.id,'publication_status',e.publication_status) else
 jsonb_build_object('id',e.id,'name',e.name,'latitude',e.latitude,'longitude',e.longitude,'publication_status',e.publication_status,
 'event_schedules',coalesce((select jsonb_agg(jsonb_build_object('starts_at',v.starts_at,'ends_at',v.ends_at,'status',v.status) order by v.id) from event_schedules v where v.event_id=e.id),'[]'::jsonb),
 'price_items',coalesce((select jsonb_agg(jsonb_build_object('amount_min',v.amount_min,'price_unit',v.price_unit,'is_estimate',v.is_estimate) order by v.id) from price_items v where v.event_id=e.id),'[]'::jsonb)) end) order by d.day_number,i.position,i.id)
 from trip_items i join trip_days d on d.id=i.trip_day_id left join places p on p.id=i.place_id left join events e on e.id=i.event_id where d.trip_id=t.id),'[]'::jsonb)) into snapshot from trips t where t.id=target_trip_id;
 return jsonb_build_object('snapshot',snapshot,'fingerprint',md5(snapshot::text));
end $$;

create function public.commit_trip_calculation(target_trip_id uuid,expected_revision bigint,expected_fingerprint text,calculated_days jsonb) returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare d jsonb; x jsonb; seg jsonb; did uuid; i trip_items; duration int; cost numeric;
begin
 perform lock_trip_plan(target_trip_id,expected_revision);
 if (trip_calculation_snapshot(target_trip_id)->>'fingerprint') is distinct from expected_fingerprint then raise exception 'Planning inputs changed' using errcode='40001'; end if;
 if jsonb_typeof(calculated_days)<>'array' or jsonb_array_length(calculated_days)<>(select count(*) from trip_days where trip_id=target_trip_id) or exists(select 1 from jsonb_array_elements(calculated_days) v group by v->>'dayId' having count(*)>1) then raise exception 'Incomplete days' using errcode='22023'; end if;
 for d in select value from jsonb_array_elements(calculated_days) loop
  did:=(d->>'dayId')::uuid;
  if not exists(select 1 from trip_days where id=did and trip_id=target_trip_id) or jsonb_typeof(d->'items') is distinct from 'array' or jsonb_array_length(d->'items')<>(select count(*) from trip_items where trip_day_id=did) or exists(select 1 from jsonb_array_elements(d->'items') v group by v->>'itemId' having count(*)>1) or jsonb_typeof(d->'routeSegments') is distinct from 'array' or jsonb_array_length(d->'routeSegments')>100 then raise exception 'Incomplete items' using errcode='22023'; end if;
  delete from route_segments where trip_day_id=did;
  for x in select value from jsonb_array_elements(d->'items') loop
   select * into i from trip_items where id=(x->>'itemId')::uuid and trip_day_id=did;
   if i.id is null then raise exception 'Foreign item' using errcode='22023'; end if;
   duration:=(x->>'durationMinutes')::int; cost:=(x->>'estimatedCost')::numeric;
   if duration not between 1 and 1440 or (x->>'validationStatus') is null or (x->>'travelDistanceKm')::numeric not between 0 and 100000 or (x->>'travelDurationMinutes')::numeric not between 0 and 1000000 or cost<0 or cost>1000000000 or cost::text in ('NaN','Infinity','-Infinity') or (x->>'validationStatus') not in ('valid','warning','conflict') or jsonb_typeof(x->'validationMessages') is distinct from 'array' or length((x->'validationMessages')::text)>16000 then raise exception 'Invalid calculation' using errcode='22023'; end if;
   if (i.is_locked or i.cost_is_manual) and cost is distinct from i.estimated_cost or (i.is_locked or i.duration_is_manual) and duration is distinct from i.duration_minutes then raise exception 'Manual values changed' using errcode='40001'; end if;
   update trip_items set duration_minutes=duration,estimated_cost=cost,travel_distance_km=(x->>'travelDistanceKm')::numeric,travel_duration_minutes=(x->>'travelDurationMinutes')::int,validation_status=x->>'validationStatus',validation_messages=x->'validationMessages' where id=i.id;
  end loop;
  for seg in select value from jsonb_array_elements(d->'routeSegments') loop
   if not exists(select 1 from trip_items a join trip_items b on b.trip_day_id=a.trip_day_id where a.id=(seg->>'fromItemId')::uuid and b.id=(seg->>'toItemId')::uuid and a.trip_day_id=did and a.position<b.position and not exists(select 1 from trip_items c where c.trip_day_id=did and c.position>a.position and c.position<b.position)) then raise exception 'Invalid segment' using errcode='22023'; end if;
   if (seg->>'distanceKm') is null or (seg->>'durationMinutes') is null or (seg->>'distanceKm')::numeric not between 0 and 100000 or (seg->>'durationMinutes')::numeric not between 0 and 1000000 then raise exception 'Invalid route estimate' using errcode='22023'; end if;
   insert into route_segments(trip_day_id,from_item_id,to_item_id,travel_mode,distance_km,duration_minutes,provider,confidence) values(did,(seg->>'fromItemId')::uuid,(seg->>'toItemId')::uuid,'driving',(seg->>'distanceKm')::numeric,(seg->>'durationMinutes')::int,'haversine','estimate');
  end loop;
  perform refresh_trip_day_summary(did);
 end loop;
end $$;

create function public.invalidate_changed_trip_inputs() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if row(new.start_date,new.end_date,new.travelers,new.preferences,new.destination_id,new.currency) is distinct from row(old.start_date,old.end_date,old.travelers,old.preferences,old.destination_id,old.currency) then
  perform invalidate_trip_plan(array(select id from trip_days where trip_id=new.id));
 end if; return null;
end $$;
create trigger trip_inputs_invalidate after update on public.trips for each row execute function public.invalidate_changed_trip_inputs();
revoke all on function public.invalidate_changed_trip_inputs() from public,anon,authenticated;

-- Private helpers and new RPCs are locked down immediately. Legacy cutover is 039.
revoke all on function public.guard_plan_revision(),public.bump_trip_plan_revision(),public.lock_trip_plan(uuid,bigint),public.invalidate_trip_plan(uuid[]) from public,anon,authenticated;
revoke all on function public.mutate_trip_item(uuid,bigint,text,jsonb),public.arrange_trip_item_versioned(uuid,bigint,uuid,uuid,uuid,uuid,jsonb),public.move_trip_item_versioned(uuid,bigint,uuid,uuid,uuid),public.schedule_trip_wishlist_versioned(uuid,bigint,uuid,uuid),public.trip_plan_options(uuid),public.seed_trip_plan(uuid,bigint,jsonb),public.trip_calculation_snapshot(uuid),public.commit_trip_calculation(uuid,bigint,text,jsonb) from public,anon;
grant execute on function public.mutate_trip_item(uuid,bigint,text,jsonb),public.arrange_trip_item_versioned(uuid,bigint,uuid,uuid,uuid,uuid,jsonb),public.move_trip_item_versioned(uuid,bigint,uuid,uuid,uuid),public.schedule_trip_wishlist_versioned(uuid,bigint,uuid,uuid),public.trip_plan_options(uuid),public.seed_trip_plan(uuid,bigint,jsonb),public.trip_calculation_snapshot(uuid),public.commit_trip_calculation(uuid,bigint,text,jsonb) to authenticated;
