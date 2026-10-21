-- REVIEW PROPOSAL ONLY. Phase B AFTER verified RPC-compatible application deployment.
-- Applying this while #113 uses raw PATCH would break metadata saves. NOT a migration.
begin;
set local lock_timeout='5s';
set local statement_timeout='30s';
do $$
declare cols text;
begin
 if to_regprocedure('public.patch_trip_metadata(uuid,bigint,jsonb)') is null then raise exception 'Metadata RPC must be installed first'; end if;
 revoke update on table public.trips from public,anon,authenticated;
 -- Table REVOKE alone does not remove pre-existing per-column grants.
 select string_agg(format('%I',attname),',') into cols from pg_attribute where attrelid='public.trips'::regclass and attnum>0 and not attisdropped;
 execute format('revoke update (%s) on table public.trips from public,anon,authenticated',cols);
end $$;
-- Existing share endpoint only updates these columns. Existing SQL owner guard
-- forbids editors rotating a token; RLS still limits readable/editable trip rows.
grant update(share_token,updated_at) on table public.trips to authenticated;
commit;
