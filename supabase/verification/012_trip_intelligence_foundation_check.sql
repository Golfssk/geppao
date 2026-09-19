-- Phase 17 Database Gate verification.
-- Run this single script after 012_trip_intelligence_foundation.sql.
-- Every row must have status = PASS before the Database Gate is closed.

with expected_columns(table_name, column_name) as (
  values
    ('trip_items', 'duration_minutes'),
    ('trip_items', 'travel_distance_km'),
    ('trip_items', 'travel_duration_minutes'),
    ('trip_items', 'validation_status'),
    ('trip_items', 'validation_messages'),
    ('trip_days', 'estimated_total_cost'),
    ('trip_days', 'estimated_travel_km'),
    ('trip_days', 'estimated_travel_minutes'),
    ('trip_days', 'validation_status'),
    ('trip_days', 'calculated_at')
),
column_check as (
  select count(*) = 10 as ok, count(*) as found
  from expected_columns expected
  join information_schema.columns actual
    on actual.table_schema = 'public'
   and actual.table_name = expected.table_name
   and actual.column_name = expected.column_name
),
table_check as (
  select
    to_regclass('public.route_segments') is not null as ok,
    case when to_regclass('public.route_segments') is null then 0 else 1 end as found
),
policy_check as (
  select
    count(*) = 2
      and count(*) filter (where policyname = 'Members read route segments') = 1
      and count(*) filter (where policyname = 'Editors manage route segments') = 1 as ok,
    count(*) as found
  from pg_policies
  where schemaname = 'public'
    and tablename = 'route_segments'
),
rls_check as (
  select coalesce(relrowsecurity, false) as ok
  from pg_class
  where oid = 'public.route_segments'::regclass
),
function_check as (
  select count(*) = 1 as ok, count(*) as found
  from information_schema.routines
  where routine_schema = 'public'
    and routine_name = 'refresh_trip_day_summary'
),
constraint_check as (
  select
    count(*) filter (where conname = 'route_segments_distinct_items_check') = 1
      and count(*) filter (where conname = 'route_segments_from_item_same_day_fkey') = 1
      and count(*) filter (where conname = 'route_segments_to_item_same_day_fkey') = 1 as ok,
    count(*) filter (where conname in (
      'route_segments_distinct_items_check',
      'route_segments_from_item_same_day_fkey',
      'route_segments_to_item_same_day_fkey'
    )) as found
  from pg_constraint
  where conrelid = 'public.route_segments'::regclass
),
duplicate_endpoint_check as (
  select count(*) = 0 as ok, count(*) as found
  from public.route_segments
  where from_item_id = to_item_id
),
checks(check_order, check_name, ok, found) as (
  select 1, 'required_columns', ok, found from column_check
  union all
  select 2, 'route_segments_table', ok, found from table_check
  union all
  select 3, 'route_segments_policies', ok, found from policy_check
  union all
  select 4, 'route_segments_rls_enabled', ok, null from rls_check
  union all
  select 5, 'refresh_trip_day_summary_function', ok, found from function_check
  union all
  select 6, 'route_segment_integrity_constraints', ok, found from constraint_check
  union all
  select 7, 'duplicate_route_endpoints', ok, found from duplicate_endpoint_check
)
select
  check_name,
  case when ok then 'PASS' else 'FAIL' end as status,
  found
from checks
order by check_order;
