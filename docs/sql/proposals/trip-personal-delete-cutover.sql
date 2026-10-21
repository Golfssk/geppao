-- PROPOSAL ONLY: Phase B, AFTER RPC-compatible application deployment and QA.
begin;
set local lock_timeout='5s';
set local statement_timeout='30s';
do $$
begin
  if to_regprocedure('public.delete_personal_trip(uuid,bigint)') is null
     or not exists(select 1 from pg_trigger where tgrelid='public.trips'::regclass
       and tgname='protect_personal_trip_delete' and not tgisinternal and tgenabled='O') then
    raise exception 'Personal deletion boundary required before cutover';
  end if;
end $$;
revoke delete on table public.trips from public,anon,authenticated;
commit;
