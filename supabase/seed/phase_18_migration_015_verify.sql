-- Phase 18 / Migration 015 verification (read-only)
WITH functions AS (
  SELECT
    p.proname,
    pg_get_functiondef(p.oid) AS definition
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname IN ('admin_upsert_accommodation_details', 'moderate_place')
), checks AS (
  SELECT 'admin_accommodation_editor_function' AS check_name,
    CASE WHEN COUNT(*) FILTER (WHERE proname = 'admin_upsert_accommodation_details') = 1 THEN 'PASS' ELSE 'FAIL' END AS status
  FROM functions
  UNION ALL
  SELECT 'moderate_place_function',
    CASE WHEN COUNT(*) FILTER (WHERE proname = 'moderate_place') = 1 THEN 'PASS' ELSE 'FAIL' END
  FROM functions
  UNION ALL
  SELECT 'accommodation_check_in_out_gate',
    CASE WHEN EXISTS (
      SELECT 1 FROM functions
      WHERE proname = 'moderate_place'
        AND definition ILIKE '%place_type = ''accommodation''%'
        AND definition ILIKE '%check_in_time is not null%'
        AND definition ILIKE '%check_out_time is not null%'
    ) THEN 'PASS' ELSE 'FAIL' END
  UNION ALL
  SELECT 'non_accommodation_hours_gate',
    CASE WHEN EXISTS (
      SELECT 1 FROM functions
      WHERE proname = 'moderate_place'
        AND definition ILIKE '%place_type <> ''accommodation''%'
        AND definition ILIKE '%place_hours%'
    ) THEN 'PASS' ELSE 'FAIL' END
  UNION ALL
  SELECT 'admin_editor_execute_grant',
    CASE WHEN has_function_privilege('authenticated', 'public.admin_upsert_accommodation_details(uuid,jsonb)', 'EXECUTE') THEN 'PASS' ELSE 'FAIL' END
)
SELECT * FROM checks ORDER BY check_name;
