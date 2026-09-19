-- Phase 18 / Consolidated Accommodation Data Pack 001
-- Duplicate preflight (READ-ONLY)
-- Run this when the guarded import reports an existing-candidate error.
-- It makes no changes.

WITH candidates(slug, candidate_name) AS (
  VALUES
    ('u-khao-yai', 'U Khao Yai'),
    ('splendid-hotel-khao-yai', 'Splendid Hotel Khao Yai'),
    ('hotel-labaris-khao-yai', 'Hotel Labaris Khao Yai'),
    ('hotel-mys-khao-yai', 'Hotel MYS Khao Yai'),
    ('kirimaya-the-resort', 'Kirimaya The Resort'),
    ('movenpick-resort-khao-yai', 'Mövenpick Resort Khao Yai'),
    ('intercontinental-khao-yai-resort', 'InterContinental Khao Yai Resort'),
    ('thames-valley-khao-yai', 'Thames Valley Khao Yai'),
    ('lala-mukha-tented-resort-khao-yai', 'Lala Mukha Tented Resort Khao Yai'),
    ('the-series-resort-khaoyai', 'The Series Resort Khaoyai'),
    ('rancho-charnvee-resort-country-club', 'Rancho Charnvee Resort & Country Club'),
    ('roukh-kiri-khaoyai', 'Roukh Kiri Khaoyai, The Centara Collection'),
    ('dusitd2-khao-yai', 'dusitD2 Khao Yai'),
    ('fortune-courtyard-hotel-khao-yai', 'Fortune Courtyard Hotel Khao Yai'),
    ('marasca-khao-yai', 'Marasca Khao Yai'),
    ('kensington-english-garden-resort-khaoyai', 'Kensington English Garden Resort Khaoyai'),
    ('muthi-maya-forest-pool-villa-resort', 'Muthi Maya Forest Pool Villa Resort'),
    ('atta-lakeside-resort-suite', 'Atta Lakeside Resort Suite'),
    ('parco-hotel-khaoyai', 'Parco Hotel Khaoyai'),
    ('le-monte-hotel-khao-yai', 'Le Monte Hotel Khao Yai')
)
SELECT
  c.slug AS candidate_slug,
  c.candidate_name,
  CASE WHEN p.id IS NULL THEN 'MISSING — eligible for import' ELSE 'EXISTS — review before import' END AS status,
  p.id AS existing_place_id,
  p.name AS existing_name,
  p.place_type AS existing_type,
  p.publication_status AS existing_publication_status,
  p.verification_status AS existing_verification_status,
  p.address AS existing_address,
  p.phone AS existing_phone,
  p.latitude AS existing_latitude,
  p.longitude AS existing_longitude,
  COALESCE(sources.source_rows, 0) AS existing_source_rows,
  COALESCE(hours.hour_rows, 0) AS existing_hour_rows,
  COALESCE(prices.price_rows, 0) AS existing_price_rows
FROM candidates c
LEFT JOIN public.places p ON p.slug = c.slug
LEFT JOIN LATERAL (
  SELECT COUNT(*)::int AS source_rows FROM public.place_sources s WHERE s.place_id = p.id
) sources ON true
LEFT JOIN LATERAL (
  SELECT COUNT(*)::int AS hour_rows FROM public.place_hours h WHERE h.place_id = p.id
) hours ON true
LEFT JOIN LATERAL (
  SELECT COUNT(*)::int AS price_rows FROM public.price_items pi WHERE pi.place_id = p.id
) prices ON true
ORDER BY c.slug;
