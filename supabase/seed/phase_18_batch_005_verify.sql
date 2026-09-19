-- Phase 18 / Batch 005 verification
-- Run this read-only query only after phase_18_batch_005_operator_intake.sql
-- has completed successfully.
--
-- Expected: six private curation records, all pending/pending.
-- These records are intentionally incomplete and must not be published until
-- the Phase 18 quality gate and Admin curation workflow are satisfied.

WITH expected AS (
  SELECT *
  FROM (
    VALUES
      ('the-chocolate-factory-khao-yai', 'The Chocolate Factory Khao Yai', 'restaurant', 'pending', 'pending', '092-443-8881', 7, 1, 0),
      ('lamaya-khaoyai', 'Lamaya Khaoyai', 'restaurant', 'pending', 'pending', NULL::text, 7, 1, 0),
      ('trot-cafe-khaoyai', 'Trot Cafe Khaoyai', 'cafe', 'pending', 'pending', '088-378-2324', 7, 1, 0),
      ('sai-sook-khao-yai', 'Sai Sook Khao Yai Wildlife Learning Ground & Local Treats', 'attraction', 'pending', 'pending', '063-242-6164', 7, 1, 0),
      ('el-cafe-khaoyai', 'EL Café Khaoyai', 'cafe', 'pending', 'pending', NULL::text, 7, 2, 0),
      ('the-park-khaoyai', 'The Park Khaoyai Cafe and Restaurant', 'restaurant', 'pending', 'pending', '096-404-6545', 7, 1, 0)
  ) AS v(
    slug,
    expected_name,
    expected_type,
    expected_publication_status,
    expected_verification_status,
    expected_phone,
    expected_hour_rows,
    expected_source_rows,
    expected_price_rows
  )
), actual AS (
  SELECT
    p.id,
    p.slug,
    p.name,
    p.place_type,
    p.publication_status,
    p.verification_status,
    p.phone,
    COALESCE(hours.hour_rows, 0) AS hour_rows,
    COALESCE(sources.source_rows, 0) AS source_rows,
    COALESCE(prices.price_rows, 0) AS price_rows
  FROM public.places p
  LEFT JOIN LATERAL (
    SELECT COUNT(*)::int AS hour_rows
    FROM public.place_hours h
    WHERE h.place_id = p.id
  ) hours ON true
  LEFT JOIN LATERAL (
    SELECT COUNT(*)::int AS source_rows
    FROM public.place_sources s
    WHERE s.place_id = p.id
  ) sources ON true
  LEFT JOIN LATERAL (
    SELECT COUNT(*)::int AS price_rows
    FROM public.price_items pi
    WHERE pi.place_id = p.id
  ) prices ON true
  WHERE p.slug IN (SELECT slug FROM expected)
)
SELECT
  e.slug,
  CASE
    WHEN a.id IS NULL THEN 'FAIL: missing'
    WHEN a.name IS DISTINCT FROM e.expected_name THEN 'FAIL: name'
    WHEN a.place_type IS DISTINCT FROM e.expected_type THEN 'FAIL: place_type'
    WHEN a.publication_status IS DISTINCT FROM e.expected_publication_status THEN 'FAIL: publication_status'
    WHEN a.verification_status IS DISTINCT FROM e.expected_verification_status THEN 'FAIL: verification_status'
    WHEN a.phone IS DISTINCT FROM e.expected_phone THEN 'FAIL: phone'
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

-- Additional integrity check: Batch 005 must create exactly six records.
SELECT
  COUNT(*) AS batch_005_place_count,
  CASE WHEN COUNT(*) = 6 THEN 'PASS' ELSE 'FAIL' END AS status
FROM public.places
WHERE slug IN (
  'the-chocolate-factory-khao-yai',
  'lamaya-khaoyai',
  'trot-cafe-khaoyai',
  'sai-sook-khao-yai',
  'el-cafe-khaoyai',
  'the-park-khaoyai'
);
