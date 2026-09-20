-- MOCK ONLY: 20-place Khao Yai Pilot Catalog fixture.
-- Never run against production. This script refuses to run unless mock mode is explicitly enabled.
-- Use only in a disposable local/preview database:
--   BEGIN; SET LOCAL app.geppao_mock_mode = 'on'; \i supabase/seed/mock_pilot_catalog_20.sql; COMMIT;

BEGIN;

DO $$
BEGIN
  IF current_setting('app.geppao_mock_mode', true) IS DISTINCT FROM 'on' THEN
    RAISE EXCEPTION 'Mock seed blocked. Run only in a disposable database with SET LOCAL app.geppao_mock_mode = ''on''.';
  END IF;
END $$;

CREATE TEMP TABLE mock_pilot_places ON COMMIT DROP AS
SELECT p.id, p.slug, p.place_type, row_number() OVER (ORDER BY p.slug) AS n
FROM public.places p
JOIN public.place_tags pt ON pt.place_id = p.id
JOIN public.tags t ON t.id = pt.tag_id
WHERE t.slug = 'pilot-catalog-khao-yai-2026';

DO $$
BEGIN
  IF (SELECT count(*) FROM mock_pilot_places) <> 20 THEN
    RAISE EXCEPTION 'Expected 20 Pilot Catalog places, found %.', (SELECT count(*) FROM mock_pilot_places);
  END IF;
END $$;

INSERT INTO public.tags (slug, name, tag_group, is_editorial)
VALUES ('mock-pilot-catalog-only', 'MOCK — Pilot Catalog only', 'internal', true)
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

INSERT INTO public.place_tags (place_id, tag_id, source)
SELECT m.id, t.id, 'mock_fixture'
FROM mock_pilot_places m
CROSS JOIN public.tags t
WHERE t.slug = 'mock-pilot-catalog-only'
ON CONFLICT (place_id, tag_id) DO NOTHING;

-- Synthetic coordinates, durations and descriptions are clearly marked as MOCK.
UPDATE public.places p
SET
  latitude = COALESCE(p.latitude, 14.45 + (m.n * 0.012)),
  longitude = COALESCE(p.longitude, 101.20 + (m.n * 0.011)),
  description = 'MOCK DATA — ' || coalesce(nullif(trim(p.description), ''), 'Sample ' || p.place_type || ' record for UX and Planner testing only.'),
  recommended_duration_minutes = COALESCE(p.recommended_duration_minutes, CASE p.place_type
    WHEN 'accommodation' THEN 60 WHEN 'restaurant' THEN 90 WHEN 'cafe' THEN 75
    WHEN 'attraction' THEN 150 WHEN 'activity' THEN 120 END),
  price_data_status = 'available',
  price_data_note = 'MOCK DATA — synthetic estimate for preview testing only; not a real price.',
  verification_status = 'unverified',
  moderation_note = 'MOCK DATA — do not treat as verified or publish as a real-world fact.',
  updated_at = now()
FROM mock_pilot_places m
WHERE p.id = m.id;

-- Add one synthetic price only where no structured price exists.
INSERT INTO public.price_items (place_id, label, amount_min, amount_max, currency, price_unit, is_estimate, audience)
SELECT m.id, 'MOCK estimate — preview only',
  CASE p.place_type WHEN 'accommodation' THEN 4500 WHEN 'restaurant' THEN 500 WHEN 'cafe' THEN 250 WHEN 'attraction' THEN 300 ELSE 800 END,
  NULL, 'THB', CASE p.place_type WHEN 'accommodation' THEN 'night' WHEN 'restaurant' THEN 'person' WHEN 'cafe' THEN 'person' WHEN 'attraction' THEN 'person' ELSE 'activity' END,
  true, 'all'
FROM mock_pilot_places m
JOIN public.places p ON p.id = m.id
WHERE NOT EXISTS (SELECT 1 FROM public.price_items pi WHERE pi.place_id = m.id);

-- Add generic mock hours only where the place currently has no usable hours.
INSERT INTO public.place_hours (place_id, day_of_week, open_time, close_time, is_closed, crosses_midnight)
SELECT m.id, d.day_of_week,
  CASE p.place_type WHEN 'accommodation' THEN '00:00'::time WHEN 'restaurant' THEN '10:00'::time WHEN 'cafe' THEN '08:00'::time WHEN 'attraction' THEN '09:00'::time ELSE '09:00'::time END,
  CASE p.place_type WHEN 'accommodation' THEN '23:59'::time WHEN 'restaurant' THEN '21:00'::time WHEN 'cafe' THEN '18:00'::time WHEN 'attraction' THEN '17:00'::time ELSE '18:00'::time END,
  false, false
FROM mock_pilot_places m
JOIN public.places p ON p.id = m.id
CROSS JOIN generate_series(0, 6)::smallint AS d(day_of_week)
WHERE NOT EXISTS (
  SELECT 1 FROM public.place_hours ph
  WHERE ph.place_id = m.id AND ph.is_closed = false AND ph.open_time IS NOT NULL AND ph.close_time IS NOT NULL
);

-- Placeholder images are deliberately branded as mock, never as venue photography.
INSERT INTO public.place_images (place_id, image_url, alt_text, sort_order, is_cover)
SELECT m.id,
  'https://placehold.co/1200x800/1f2937/ffffff?text=MOCK+' || replace(upper(p.place_type), ' ', '+'),
  'MOCK placeholder image — not venue photography', 0, true
FROM mock_pilot_places m
JOIN public.places p ON p.id = m.id
WHERE NOT EXISTS (SELECT 1 FROM public.place_images pi WHERE pi.place_id = m.id);

INSERT INTO public.place_sources (place_id, source_type, source_url, source_note, checked_at, checked_by)
SELECT m.id, 'mock_fixture', NULL,
  'MOCK DATA — synthetic values generated for a disposable preview environment only.', now(), NULL
FROM mock_pilot_places m
WHERE NOT EXISTS (
  SELECT 1 FROM public.place_sources ps
  WHERE ps.place_id = m.id AND ps.source_type = 'mock_fixture'
);

SELECT
  count(*)::int AS mock_places,
  count(*) FILTER (WHERE p.latitude IS NOT NULL AND p.longitude IS NOT NULL)::int AS with_coordinates,
  count(*) FILTER (WHERE p.recommended_duration_minutes IS NOT NULL)::int AS with_duration,
  count(*) FILTER (WHERE EXISTS (SELECT 1 FROM public.price_items pi WHERE pi.place_id = p.id))::int AS with_price,
  count(*) FILTER (WHERE EXISTS (SELECT 1 FROM public.place_hours ph WHERE ph.place_id = p.id AND ph.is_closed = false))::int AS with_hours,
  count(*) FILTER (WHERE EXISTS (SELECT 1 FROM public.place_images i WHERE i.place_id = p.id))::int AS with_image
FROM public.places p
JOIN mock_pilot_places m ON m.id = p.id;

COMMIT;
