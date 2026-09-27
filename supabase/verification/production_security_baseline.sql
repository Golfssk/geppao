-- Read-only Production security and performance baseline.
-- Expected: query 1 returns zero rows. Query 2 returns only intentionally public RPCs.

-- 1. SECURITY DEFINER functions without a fixed public search_path.
select
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  p.proconfig
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.prosecdef
  and not coalesce(p.proconfig, array[]::text[]) @> array['search_path=public']
order by 1, 2, 3;

-- 2. Public/anonymous execution on privileged functions.
-- The intended anonymous allowlist is get_shared_trip and track_product_event only.
select
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  has_function_privilege('anon', p.oid, 'execute') as anon_can_execute,
  has_function_privilege('authenticated', p.oid, 'execute') as authenticated_can_execute
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.prosecdef
order by 1, 2, 3;

-- 3. Foreign keys whose referencing columns have no covering index prefix.
select
  n.nspname as schema_name,
  c.relname as table_name,
  con.conname as constraint_name,
  pg_get_constraintdef(con.oid) as definition
from pg_constraint con
join pg_class c on c.oid = con.conrelid
join pg_namespace n on n.oid = c.relnamespace
where con.contype = 'f'
  and n.nspname = 'public'
  and not exists (
    select 1
    from pg_index i
    where i.indrelid = con.conrelid
      and i.indisvalid
      and (i.indkey::smallint[])[0:cardinality(con.conkey)-1] = con.conkey
  )
order by 1, 2, 3;

-- 4. Current RLS policy inventory for regression review.
select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
