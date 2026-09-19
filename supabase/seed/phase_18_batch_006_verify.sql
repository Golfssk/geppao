-- Phase 18 / Batch 006 verification
-- Run this read-only query only after phase_18_batch_006_hotel_venue_intake.sql
-- has completed successfully.

WITH expected AS (
  SELECT *
  FROM (
    VALUES
      ('lacol-dome-dining', 'Lacol Dome Dining', 'restaurant', false, 7, 1),
      ('journey-cafe-bar-lacol-khao-yai', 'Journey Café & Bar', 'cafe', false, 7, 1),
      ('audrey-lacol-khao-yai', 'Audrey', 'restaurant', false, 7, 1),
      ('raleuk-khaoyai', 'Raleuk Khaoyai', 'restaurant', false, 7, 1),
      ('poirot-intercontinental-khao-yai', 'Poirot', 'restaurant', true, 7, 2),
      ('tea-carriage-intercontinental-khao-yai', 'Tea Carriage', 'cafe', true, 7, 2),
      ('somyings-kitchen-intercontinental-khao-yai', 'Somying’s Kitchen', 'restaurant', false, 0, 2)
  ) AS v(slug, expected_name, expected_type, expected_reservation_required, expected_hour_rows, expected_source_rows)
), actual AS (
  SELECT
    p.id,
    p.slug,
    p.name,
    p.place_type,
    p.reservation_required,
    p.publication_status,
    p.verification_status,
    COALESCE(hours.hour_rows, 0) AS hour_rows,
    COALESCE(sources.source_rows, 0) AS source_rows,
    COALESCE(prices.price_rows, 0) AS price_rows
  FROM public.places p
  LEFT JOIN LATERAL (
    SELECT COUNT(*)::int AS hour_rows FROM public.place_hours h WHERE h.place_id = p.id
  ) hours ON true
  LEFT JOIN LATERAL (
    SELECT COUNT(*)::int AS source_rows FROM public.place_sources s WHERE s.place_id = p.id
  ) sources ON true
  LEFT JOIN LATERAL (
    SELECT COUNT(*)::int AS price_rows FROM public.price_items pi WHERE pi.place_id = p.id
  ) prices ON true
  WHERE p.slug IN (SELECT slug FROM expected)
)
SELECT
  e.slug,
  CASE
    WHEN a.id IS NULL THEN 'FAIL: missing'
    WHEN a.name IS DISTINCT FROM e.expected_name THEN 'FAIL: name'
    WHEN a.place_type IS DISTINCT FROM e.expected_type THEN 'FAIL: place_type'
    WHEN a.reservation_required IS DISTINCT FROM e.expected_reservation_required THEN 'FAIL: reservation_required'
    WHEN a.publication_status IS DISTINCT FROM 'pending' THEN 'FAIL: publication_status'
    WHEN a.verification_status IS DISTINCT FROM 'pending' THEN 'FAIL: verification_status'
    WHEN a.hour_rows <> e.expected_hour_rows THEN 'FAIL: hour_rows'
    WHEN a.source_rows <> e.expected_source_rows THEN 'FAIL: source_rows'
    WHEN a.price_rows <> 0 THEN 'FAIL: price_rows'
    ELSE 'PASS'
  END AS status,
  a.name,
  a.place_type,
  a.reservation_required,
  a.publication_status,
  a.verification_status,
  a.hour_rows,
  a.source_rows,
  a.price_rows
FROM expected e
LEFT JOIN actual a ON a.slug = e.slug
ORDER BY e.slug;

SELECT
  COUNT(*) AS batch_006_place_count,
  CASE WHEN COUNT(*) = 7 THEN 'PASS' ELSE 'FAIL' END AS status
FROM public.places
WHERE slug IN (
  'lacol-dome-dining',
  'journey-cafe-bar-lacol-khao-yai',
  'audrey-lacol-khao-yai',
  'raleuk-khaoyai',
  'poirot-intercontinental-khao-yai',
  'tea-carriage-intercontinental-khao-yai',
  'somyings-kitchen-intercontinental-khao-yai'
);
