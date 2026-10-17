-- PROPOSAL ONLY. Not an ordered migration; not approved for hosted application.
-- Phase A: install before any browser DELETE grant cutover.
begin;
set local lock_timeout='5s';
set local statement_timeout='30s';

create function public.guard_personal_trip_delete()
returns trigger language plpgsql security definer
set search_path=public,pg_temp as $$
declare fk record; has_rows boolean;
begin
  if auth.uid() is null or old.owner_user_id is distinct from auth.uid() then
    raise exception 'Owner required' using errcode='42501';
  end if;
  if old.share_token is not null then
    raise exception 'Trip has shared data; archive instead' using errcode='55006';
  end if;
  -- The DELETE/RPC holds the parent row lock. Existing group RPCs lock this same
  -- parent before writing. SECURITY DEFINER sees even another member's wallet;
  -- only a generic refusal is returned, never a table name or reservation value.
  for fk in
    select c.conkey,c.confkey,n.nspname,r.relname,a.attname,
           p.attname as parent_column
    from pg_constraint c
    join pg_class r on r.oid=c.conrelid
    join pg_namespace n on n.oid=r.relnamespace
    left join pg_attribute a on a.attrelid=c.conrelid and a.attnum=c.conkey[1]
    left join pg_attribute p on p.attrelid=c.confrelid and p.attnum=c.confkey[1]
    where c.contype='f' and c.confrelid='public.trips'::regclass
      and c.conrelid not in ('public.trip_days'::regclass,'public.trip_wishlist'::regclass)
  loop
    -- Unknown/composite relations are not silently exempted after schema growth.
    if cardinality(fk.conkey)<>1 or cardinality(fk.confkey)<>1
       or fk.parent_column is distinct from 'id' then
      raise exception 'Trip has shared data; archive instead' using errcode='55006';
    end if;
    execute format('select exists(select 1 from %I.%I where %I=$1)',
                   fk.nspname,fk.relname,fk.attname) into has_rows using old.id;
    if has_rows then
      raise exception 'Trip has shared data; archive instead' using errcode='55006';
    end if;
  end loop;
  return old;
end $$;
revoke all on function public.guard_personal_trip_delete() from public,anon,authenticated;
create trigger protect_personal_trip_delete before delete on public.trips
for each row execute function public.guard_personal_trip_delete();

create function public.delete_personal_trip(target_trip_id uuid,expected_revision bigint)
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare removed uuid;
begin
  if auth.uid() is null then raise exception 'Owner required' using errcode='42501';end if;
  perform 1 from public.trips where id=target_trip_id and owner_user_id=auth.uid() for update;
  if not found then raise exception 'Owner required' using errcode='42501';end if;
  perform public.lock_trip_plan(target_trip_id,expected_revision);
  delete from public.trips where id=target_trip_id and owner_user_id=auth.uid()
    and plan_revision=expected_revision returning id into removed;
  if removed is null then raise exception 'Trip changed' using errcode='40001';end if;
  return removed;
end $$;
revoke all on function public.delete_personal_trip(uuid,bigint) from public,anon,authenticated;
grant execute on function public.delete_personal_trip(uuid,bigint) to authenticated;
commit;
