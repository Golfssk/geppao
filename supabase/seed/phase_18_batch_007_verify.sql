-- Phase 18 / Batch 007 verification
-- Run this read-only query only after phase_18_batch_007_attraction_intake.sql.

WITH expected AS (
  SELECT *
  FROM (
    VALUES
      ('khao-yai-art-museum', 'Khao Yai Art Museum', 'attraction', NULL::text, 7, 1, 0),
      ('khao-yai-speedkart', 'Khao Yai Speedkart', 'activity', NULL::text, 7, 1, 0),
      ('primo-piazza-khao-yai', 'Primo Piazza Khao Yai', 'attraction', '081-922-9000', 0, 1, 0)
  ) AS v(slug, expected_name, expected_type, expected_phone, expected_hour_rows, expected_source_rows, expected_price_rows)
), actual AS (
  SELECT
    p.id,
    p.slug,
    p.name,
    p.place_type,
    p.phone,
    p.publication_status,
    p.verification_status,
    COALESCE(hours.hour_rows, 0) AS hour_rows,
    COALESCE(sources.source_rows, 0) AS source_rows,
    COALESCE(prices.price_rows, 0) AS price_rows
  FROM public.places p
  LEFT JOIN LATERAL (SELECT COUNT(*)::int AS hour_rows FROM public.place_hours h WHERE h.place_id = p.id) hours ON true
  LEFT JOIN LATERAL (SELECT COUNT(*)::int AS source_rows FROM public.place_sources s WHERE s.place_id = p.id) sources ON true
  LEFT JOIN LATERAL (SELECT COUNT(*)::int AS price_rows FROM public.price_items pi WHERE pi.place_id = p.id) prices ON true
  WHERE p.slug IN (SELECT slug FROM expected)
)
SELECT
  e.slug,
  CASE
    WHEN a.id IS NULL THEN 'FAIL: missing'
    WHEN a.name IS DISTINCT FROM e.expected_name THEN 'FAIL: name'
    WHEN a.place_type IS DISTINCT FROM e.expected_type THEN 'FAIL: place_type'
    WHEN a.phone IS DISTINCT FROM e.expected_phone THEN 'FAIL: phone'
    WHEN a.publication_status IS DISTINCT FROM 'pending' THEN 'FAIL: publication_status'
    WHEN a.verification_status IS DISTINCT FROM 'pending' THEN 'FAIL: verification_status'
    WHEN a.hour_rows <> e.expected_hour_rows THEN 'FAIL: hour_rows'
    WHEN a.source_rows <> e.expected_source_rows THEN 'FAIL: source_rows'
    WHEN a.price_rows <> e.expected_price_rows THEN 'FAIL: price_rows'
    ELSE 'PASS'
  END AS status,
  a.name,
  a.place_type,
  a.publication_status,
  a.verification_status,
  a.phone,
  a.hour_rows,
  a.source_rows,
  a.price_rows
FROM expected e
LEFT JOIN actual a ON a.slug = e.slug
ORDER BY e.slug;

SELECT
  COUNT(*) AS batch_007_place_count,
  CASE WHEN COUNT(*) = 3 THEN 'PASS' ELSE 'FAIL' END AS status
FROM public.places
WHERE slug IN ('khao-yai-art-museum', 'khao-yai-speedkart', 'primo-piazza-khao-yai');
