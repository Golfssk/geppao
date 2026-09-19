-- Phase 18 / Batch 008 verification
-- Run this read-only query only after phase_18_batch_008_accommodation_intake.sql.

WITH expected AS (
  SELECT *
  FROM (
    VALUES
      ('u-khao-yai', 'U Khao Yai', '044-079-999', NULL::double precision, NULL::double precision),
      ('splendid-hotel-khao-yai', 'Splendid Hotel Khao Yai', '095-205-1819', NULL::double precision, NULL::double precision),
      ('hotel-labaris-khao-yai', 'Hotel Labaris Khao Yai', '063-190-1900', NULL::double precision, NULL::double precision),
      ('hotel-mys-khao-yai', 'Hotel MYS Khao Yai', NULL::text, NULL::double precision, NULL::double precision),
      ('kirimaya-the-resort', 'Kirimaya The Resort', '044-426-000', NULL::double precision, NULL::double precision),
      ('movenpick-resort-khao-yai', 'Mövenpick Resort Khao Yai', '044-009-100', 14.674605::double precision, 101.577165::double precision)
  ) AS v(slug, expected_name, expected_phone, expected_latitude, expected_longitude)
), actual AS (
  SELECT
    p.id,
    p.slug,
    p.name,
    p.place_type,
    p.phone,
    p.latitude,
    p.longitude,
    p.publication_status,
    p.verification_status,
    COALESCE(sources.source_rows, 0) AS source_rows,
    COALESCE(hours.hour_rows, 0) AS hour_rows,
    COALESCE(prices.price_rows, 0) AS price_rows
  FROM public.places p
  LEFT JOIN LATERAL (SELECT COUNT(*)::int AS source_rows FROM public.place_sources s WHERE s.place_id = p.id) sources ON true
  LEFT JOIN LATERAL (SELECT COUNT(*)::int AS hour_rows FROM public.place_hours h WHERE h.place_id = p.id) hours ON true
  LEFT JOIN LATERAL (SELECT COUNT(*)::int AS price_rows FROM public.price_items pi WHERE pi.place_id = p.id) prices ON true
  WHERE p.slug IN (SELECT slug FROM expected)
)
SELECT
  e.slug,
  CASE
    WHEN a.id IS NULL THEN 'FAIL: missing'
    WHEN a.name IS DISTINCT FROM e.expected_name THEN 'FAIL: name'
    WHEN a.place_type IS DISTINCT FROM 'accommodation' THEN 'FAIL: place_type'
    WHEN a.phone IS DISTINCT FROM e.expected_phone THEN 'FAIL: phone'
    WHEN a.latitude IS DISTINCT FROM e.expected_latitude THEN 'FAIL: latitude'
    WHEN a.longitude IS DISTINCT FROM e.expected_longitude THEN 'FAIL: longitude'
    WHEN a.publication_status IS DISTINCT FROM 'pending' THEN 'FAIL: publication_status'
    WHEN a.verification_status IS DISTINCT FROM 'pending' THEN 'FAIL: verification_status'
    WHEN a.source_rows <> 1 THEN 'FAIL: source_rows'
    WHEN a.hour_rows <> 0 THEN 'FAIL: hour_rows'
    WHEN a.price_rows <> 0 THEN 'FAIL: price_rows'
    ELSE 'PASS'
  END AS status,
  a.name,
  a.publication_status,
  a.verification_status,
  a.phone,
  a.latitude,
  a.longitude,
  a.hour_rows,
  a.source_rows,
  a.price_rows
FROM expected e
LEFT JOIN actual a ON a.slug = e.slug
ORDER BY e.slug;

SELECT
  COUNT(*) AS batch_008_place_count,
  CASE WHEN COUNT(*) = 6 THEN 'PASS' ELSE 'FAIL' END AS status
FROM public.places
WHERE slug IN (
  'u-khao-yai',
  'splendid-hotel-khao-yai',
  'hotel-labaris-khao-yai',
  'hotel-mys-khao-yai',
  'kirimaya-the-resort',
  'movenpick-resort-khao-yai'
);
