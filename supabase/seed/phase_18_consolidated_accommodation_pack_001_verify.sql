-- Phase 18 / Consolidated Accommodation Data Pack 001 verification
-- Read-only. Run only after phase_18_consolidated_accommodation_pack_001.sql succeeds.

WITH expected(slug, expected_name, expected_phone, expected_latitude, expected_longitude) AS (
  VALUES
    ('u-khao-yai', 'U Khao Yai', '044-079-999', NULL::double precision, NULL::double precision),
    ('splendid-hotel-khao-yai', 'Splendid Hotel Khao Yai', '095-205-1819', NULL::double precision, NULL::double precision),
    ('hotel-labaris-khao-yai', 'Hotel Labaris Khao Yai', '063-190-1900', NULL::double precision, NULL::double precision),
    ('hotel-mys-khao-yai', 'Hotel MYS Khao Yai', NULL::text, NULL::double precision, NULL::double precision),
    ('kirimaya-the-resort', 'Kirimaya The Resort', '044-426-000', NULL::double precision, NULL::double precision),
    ('movenpick-resort-khao-yai', 'Mövenpick Resort Khao Yai', '044-009-100', 14.674605::double precision, 101.577165::double precision),
    ('intercontinental-khao-yai-resort', 'InterContinental Khao Yai Resort', '044-082-039', NULL::double precision, NULL::double precision),
    ('thames-valley-khao-yai', 'Thames Valley Khao Yai', '044-009-999', NULL::double precision, NULL::double precision),
    ('lala-mukha-tented-resort-khao-yai', 'Lala Mukha Tented Resort Khao Yai', '044-300-691', NULL::double precision, NULL::double precision),
    ('the-series-resort-khaoyai', 'The Series Resort Khaoyai', '044-081-222', NULL::double precision, NULL::double precision),
    ('rancho-charnvee-resort-country-club', 'Rancho Charnvee Resort & Country Club', '044-756-210', NULL::double precision, NULL::double precision),
    ('roukh-kiri-khaoyai', 'Roukh Kiri Khaoyai, The Centara Collection', '044-001-300', NULL::double precision, NULL::double precision),
    ('dusitd2-khao-yai', 'dusitD2 Khao Yai', '044-003-000', NULL::double precision, NULL::double precision),
    ('fortune-courtyard-hotel-khao-yai', 'Fortune Courtyard Hotel Khao Yai', '044-071-616', NULL::double precision, NULL::double precision),
    ('marasca-khao-yai', 'Marasca Khao Yai', '044-003-640', NULL::double precision, NULL::double precision),
    ('kensington-english-garden-resort-khaoyai', 'Kensington English Garden Resort Khaoyai', '044-009-522', NULL::double precision, NULL::double precision),
    ('muthi-maya-forest-pool-villa-resort', 'Muthi Maya Forest Pool Villa Resort', '044-426-000', NULL::double precision, NULL::double precision),
    ('atta-lakeside-resort-suite', 'Atta Lakeside Resort Suite', '044-426-000', NULL::double precision, NULL::double precision),
    ('parco-hotel-khaoyai', 'Parco Hotel Khaoyai', '091-116-1818', NULL::double precision, NULL::double precision),
    ('le-monte-hotel-khao-yai', 'Le Monte Hotel Khao Yai', '044-077-770', NULL::double precision, NULL::double precision)
), actual AS (
  SELECT
    p.id, p.slug, p.name, p.place_type, p.phone, p.latitude, p.longitude,
    p.publication_status, p.verification_status,
    (SELECT COUNT(*)::int FROM public.place_sources s WHERE s.place_id = p.id) AS source_rows,
    (SELECT COUNT(*)::int FROM public.place_hours h WHERE h.place_id = p.id) AS hour_rows,
    (SELECT COUNT(*)::int FROM public.price_items pi WHERE pi.place_id = p.id) AS price_rows
  FROM public.places p
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
  a.name, a.publication_status, a.verification_status, a.phone,
  a.latitude, a.longitude, a.hour_rows, a.source_rows, a.price_rows
FROM expected e
LEFT JOIN actual a ON a.slug = e.slug
ORDER BY e.slug;

SELECT
  COUNT(*) AS place_count,
  CASE WHEN COUNT(*) = 20 THEN 'PASS' ELSE 'FAIL' END AS status
FROM public.places
WHERE slug IN (
  'u-khao-yai', 'splendid-hotel-khao-yai', 'hotel-labaris-khao-yai',
  'hotel-mys-khao-yai', 'kirimaya-the-resort', 'movenpick-resort-khao-yai',
  'intercontinental-khao-yai-resort', 'thames-valley-khao-yai',
  'lala-mukha-tented-resort-khao-yai', 'the-series-resort-khaoyai',
  'rancho-charnvee-resort-country-club', 'roukh-kiri-khaoyai',
  'dusitd2-khao-yai', 'fortune-courtyard-hotel-khao-yai',
  'marasca-khao-yai', 'kensington-english-garden-resort-khaoyai',
  'muthi-maya-forest-pool-villa-resort', 'atta-lakeside-resort-suite',
  'parco-hotel-khaoyai', 'le-monte-hotel-khao-yai'
);
