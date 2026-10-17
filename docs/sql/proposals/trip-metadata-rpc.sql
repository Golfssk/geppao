-- REVIEW PROPOSAL ONLY. NOT an ordered migration; do not apply to a hosted DB.
-- Phase A is additive. Promote only after review, isolated acceptance and approval.
begin;
set local lock_timeout='5s';
set local statement_timeout='30s';
create function public.patch_trip_metadata(target_trip_id uuid,expected_revision bigint,payload jsonb)
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare n numeric; label text; key text;
begin
 if auth.uid() is null then raise exception 'Not permitted' using errcode='42501'; end if;
 -- Lock first, and check the actual owner in SQL; API claims are not authority.
 perform 1 from public.trips where id=target_trip_id and owner_user_id=auth.uid() for update;
 if not found then raise exception 'Not permitted' using errcode='42501'; end if;
 perform public.lock_trip_plan(target_trip_id,expected_revision);
 if jsonb_typeof(payload) is distinct from 'object' or payload='{}'::jsonb then raise exception 'Invalid metadata' using errcode='22023'; end if;
 for key in select jsonb_object_keys(payload) loop
  if key not in ('title','status','travelers','budget_total') then raise exception 'Unsupported metadata' using errcode='22023'; end if;
 end loop;
 if payload ? 'title' then
  label:=btrim(payload->>'title');
  if jsonb_typeof(payload->'title') is distinct from 'string' or label is null or length(label) not between 1 and 160 then raise exception 'Invalid title' using errcode='22023'; end if;
 end if;
 if payload ? 'status' and (jsonb_typeof(payload->'status') is distinct from 'string' or payload->>'status' not in ('draft','planned','active','completed','archived')) then raise exception 'Invalid status' using errcode='22023'; end if;
 if payload ? 'travelers' then
  if jsonb_typeof(payload->'travelers') is distinct from 'number' then raise exception 'Invalid travelers' using errcode='22023'; end if;
  n:=(payload->>'travelers')::numeric;
  if n<1 or n>100 or n<>trunc(n) then raise exception 'Invalid travelers' using errcode='22023'; end if;
 end if;
 if payload ? 'budget_total' then
  if jsonb_typeof(payload->'budget_total') not in ('number','null') then raise exception 'Invalid budget' using errcode='22023'; end if;
  n:=(payload->>'budget_total')::numeric;
  if n<0 or n>100000000 or n<>round(n,2) then raise exception 'Invalid budget' using errcode='22023'; end if;
 end if;
 update public.trips set
  title=case when payload ? 'title' then label else title end,
  status=case when payload ? 'status' then payload->>'status' else status end,
  travelers=case when payload ? 'travelers' then (payload->>'travelers')::numeric::integer else travelers end,
  budget_total=case when payload ? 'budget_total' then (payload->>'budget_total')::numeric else budget_total end,
  updated_at=now()
 where id=target_trip_id and owner_user_id=auth.uid();
 -- AFTER triggers may increment again. Callers must refresh, never guess the version.
 return target_trip_id;
end $$;
revoke all on function public.patch_trip_metadata(uuid,bigint,jsonb) from public,anon,authenticated;
grant execute on function public.patch_trip_metadata(uuid,bigint,jsonb) to authenticated;
commit;
