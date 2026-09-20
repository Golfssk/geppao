-- Phase 19 / Migration 016 consolidated verification (read-only).

with checks as (
  select 'analytics_table' as check_name,
         case when to_regclass('public.product_analytics_events') is not null then 'PASS' else 'FAIL' end as status
  union all
  select 'analytics_rls_enabled',
         case when exists (
           select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
           where n.nspname = 'public' and c.relname = 'product_analytics_events' and c.relrowsecurity
         ) then 'PASS' else 'FAIL' end
  union all
  select 'admin_read_policy',
         case when (select count(*) from pg_policies where schemaname = 'public' and tablename = 'product_analytics_events' and cmd = 'SELECT') = 1
           then 'PASS' else 'FAIL' end
  union all
  select 'no_direct_insert_policy',
         case when (select count(*) from pg_policies where schemaname = 'public' and tablename = 'product_analytics_events' and cmd in ('INSERT', 'ALL')) = 0
           then 'PASS' else 'FAIL' end
  union all
  select 'track_product_event_function',
         case when to_regprocedure('public.track_product_event(text,uuid,uuid,uuid,uuid,uuid,text,text,jsonb)') is not null
           then 'PASS' else 'FAIL' end
  union all
  select 'analytics_summary_function',
         case when to_regprocedure('public.get_product_analytics_summary(integer)') is not null
           then 'PASS' else 'FAIL' end
  union all
  select 'anonymous_tracking_grant',
         case when has_function_privilege('anon', 'public.track_product_event(text,uuid,uuid,uuid,uuid,uuid,text,text,jsonb)', 'EXECUTE')
           then 'PASS' else 'FAIL' end
  union all
  select 'authenticated_tracking_grant',
         case when has_function_privilege('authenticated', 'public.track_product_event(text,uuid,uuid,uuid,uuid,uuid,text,text,jsonb)', 'EXECUTE')
           then 'PASS' else 'FAIL' end
  union all
  select 'admin_summary_grant',
         case when has_function_privilege('authenticated', 'public.get_product_analytics_summary(integer)', 'EXECUTE')
           then 'PASS' else 'FAIL' end
  union all
  select 'required_constraints',
         case when (
           select count(*)
           from pg_constraint
           where conrelid = 'public.product_analytics_events'::regclass
             and conname in (
               'product_analytics_actor_check',
               'product_analytics_metadata_object_check',
               'product_analytics_metadata_size_check'
             )
         ) = 3 then 'PASS' else 'FAIL' end
)
select check_name, status from checks order by check_name;
