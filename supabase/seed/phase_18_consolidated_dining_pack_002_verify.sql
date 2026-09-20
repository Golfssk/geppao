-- Phase 18 / Consolidated Dining Data Pack 002 verification (read-only)
WITH expected(slug, expected_type, minimum_hour_rows) AS (
  VALUES
    ('midwinter-khao-yai', 'restaurant', 0), ('the-castle-restaurant-and-tea-room', 'restaurant', 0), ('prime-19-khao-yai', 'restaurant', 0), ('the-witches-brew-restaurant-khao-yai', 'restaurant', 0), ('banmai-chay-nam-pak-chong', 'restaurant', 7), ('yellowsubmarine-coffee', 'cafe', 1), ('the-birders-lodge-cafe', 'cafe', 0), ('please-dont-tell-khaoyai', 'cafe', 0), ('like-a-mountain-khao-yai', 'cafe', 7), ('baankhaofae-farm-eatery-coffee', 'cafe', 0), ('the-creek-khao-yai', 'cafe', 0), ('olna-khaoyai', 'cafe', 7), ('flavours-of-khao-yai', 'restaurant', 7), ('sapori-cucina-khao-yai', 'restaurant', 7), ('castleton-cafe-khao-yai', 'cafe', 7), ('acala-restaurant-khao-yai', 'restaurant', 0), ('tani-restaurant-khao-yai', 'restaurant', 0), ('cha-la-restaurant-bar-khao-yai', 'restaurant', 7), ('the-fable-feast-khao-yai', 'restaurant', 7), ('clotted-cream-tea-room-khao-yai', 'cafe', 7)
), actual AS (
  SELECT p.id, p.slug, p.name, p.place_type, p.publication_status, p.verification_status,
    (SELECT COUNT(*)::int FROM public.place_sources s WHERE s.place_id = p.id) AS source_rows,
    (SELECT COUNT(*)::int FROM public.place_hours h WHERE h.place_id = p.id) AS hour_rows,
    (SELECT COUNT(*)::int FROM public.price_items pi WHERE pi.place_id = p.id) AS price_rows
  FROM public.places p
  WHERE p.slug IN (SELECT slug FROM expected)
)
SELECT e.slug,
  CASE WHEN a.id IS NULL THEN 'FAIL: missing'
       WHEN a.place_type IS DISTINCT FROM e.expected_type THEN 'FAIL: place_type'
       WHEN a.publication_status IS DISTINCT FROM 'pending' THEN 'FAIL: publication_status'
       WHEN a.verification_status IS DISTINCT FROM 'pending' THEN 'FAIL: verification_status'
       WHEN a.source_rows < 1 THEN 'FAIL: source_rows'
       WHEN a.hour_rows < e.minimum_hour_rows THEN 'FAIL: hour_rows'
       WHEN a.price_rows <> 0 THEN 'FAIL: price_rows'
       ELSE 'PASS' END AS status,
  a.name, a.place_type, a.publication_status, a.verification_status,
  a.hour_rows, a.source_rows, a.price_rows
FROM expected e LEFT JOIN actual a ON a.slug = e.slug
ORDER BY e.slug;

SELECT COUNT(*) AS place_count,
  CASE WHEN COUNT(*) = 20 THEN 'PASS' ELSE 'FAIL' END AS status
FROM public.places
WHERE slug IN (
  'midwinter-khao-yai','the-castle-restaurant-and-tea-room','prime-19-khao-yai','the-witches-brew-restaurant-khao-yai','banmai-chay-nam-pak-chong','yellowsubmarine-coffee','the-birders-lodge-cafe','please-dont-tell-khaoyai','like-a-mountain-khao-yai','baankhaofae-farm-eatery-coffee','the-creek-khao-yai','olna-khaoyai','flavours-of-khao-yai','sapori-cucina-khao-yai','castleton-cafe-khao-yai','acala-restaurant-khao-yai','tani-restaurant-khao-yai','cha-la-restaurant-bar-khao-yai','the-fable-feast-khao-yai','clotted-cream-tea-room-khao-yai'
);
