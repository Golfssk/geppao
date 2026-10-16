-- READ ONLY: run on the target environment before any migration; archive output securely.
-- Migration history is NOT proof of schema state. Never replay 001-027 on a live database.
with required(table_name,column_name) as (values
 ('places','publication_status'),('places','verification_status'),('places','last_verified_at'),
 ('places','moderated_by'),('places','moderated_at'),('places','moderation_note'),('places','price_data_status'),
 ('events','publication_status'),('events','verification_status'),('events','last_verified_at'),
 ('events','moderated_by'),('events','moderated_at'),('events','moderation_note'),
 ('place_images','approved_for_public'),('place_images','approved_by'),('place_images','approved_at'),('place_images','rights_expires_at'),
 ('event_images','approved_for_public'),('event_images','approved_by'),('event_images','approved_at'),('event_images','rights_expires_at'),
 ('accommodation_details','room_count'))
select 'missing_prerequisite_column' as finding,r.table_name,r.column_name
from required r where not exists(select 1 from information_schema.columns c
 where c.table_schema='public' and c.table_name=r.table_name and c.column_name=r.column_name);
select name,to_regprocedure(name) as installed from (values
 ('public.is_geppao_admin()'),('public.is_business_editor(uuid)'),('storage.foldername(text)'),
 ('public.search_public_stays(text,text,integer,boolean,boolean,boolean,boolean,numeric,text,integer)'),
 ('public.admin_stage_place_import(text,jsonb,jsonb)'),
 ('public.admin_accept_place_import(uuid,uuid,uuid[],text)')) f(name);
select n.nspname,c.relname,t.tgname,pg_get_triggerdef(t.oid) as definition
from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relname in('places','events','place_images','event_images') and not t.tgisinternal;
select schemaname,tablename,policyname,permissive,roles,cmd,qual,with_check from pg_policies
where (schemaname='public' and tablename in('places','place_images','place_import_candidates','place_external_ids','place_field_evidence'))
 or (schemaname='storage' and tablename='objects');
-- Existing legacy state is reviewed, NOT auto-repaired or auto-published.
select id,name from public.places where publication_status='published' and not exists(
 select 1 from public.place_images i where i.place_id=places.id and i.is_cover and i.approved_for_public
  and i.takedown_status='active' and (i.rights_expires_at is null or i.rights_expires_at>=current_date));
