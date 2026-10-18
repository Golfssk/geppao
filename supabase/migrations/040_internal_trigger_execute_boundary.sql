begin;
set local lock_timeout = '3s';
set local statement_timeout = '15s';

-- This function is only an attached trigger, never an application RPC.
-- Existing triggers do not require callers to hold EXECUTE on the trigger function.
-- Fail closed on schema drift instead of modifying a different API surface.
do $$
begin
 if not exists (
  select 1 from pg_proc p join pg_trigger t on t.tgfoid=p.oid
  where p.oid=to_regprocedure('public.guard_directory_provenance()')
   and p.prorettype='pg_catalog.trigger'::regtype
   and t.tgrelid='public.places'::regclass and not t.tgisinternal
   and t.tgenabled <> 'D'
 ) then
  raise exception 'Expected attached directory provenance trigger is missing';
 end if;
end $$;

revoke all on function public.guard_directory_provenance() from public, anon, authenticated;

do $$
begin
 if has_function_privilege('anon','public.guard_directory_provenance()','EXECUTE')
  or has_function_privilege('authenticated','public.guard_directory_provenance()','EXECUTE') then
  raise exception 'Unexpected inherited trigger execution privilege remains';
 end if;
end $$;
commit;
