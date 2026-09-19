-- Phase 17 Database Gate verification.
-- Run this after 012_trip_intelligence_foundation.sql in Supabase SQL Editor.
-- Expected: all required rows are present; policy_count is 2; function_count is 1.

select
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
  and (
    (table_name = 'trip_items' and column_name in (
      'duration_minutes',
      'travel_distance_km',
      'travel_duration_minutes',
      'validation_status',
      'validation_messages'
    ))
    or
    (table_name = 'trip_days' and column_name in (
      'estimated_total_cost',
      'estimated_travel_km',
      'estimated_travel_minutes',
      'validation_status',
      'calculated_at'
    ))
  )
order by table_name, column_name;

select
  to_regclass('public.route_segments') as route_segments_table,
  to_regclass('public.trip_items') as trip_items_table,
  to_regclass('public.trip_days') as trip_days_table;

select
  policyname,
  cmd,
  roles::text as roles
from pg_policies
where schemaname = 'public'
  and tablename = 'route_segments'
order by policyname;

select
  routine_schema,
  routine_name,
  data_type
from information_schema.routines
where routine_schema = 'public'
  and routine_name = 'refresh_trip_day_summary';

select
  conname,
  contype,
  pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid = 'public.route_segments'::regclass
order by conname;
