-- Phase 18 / Batch 007
-- Direct-source attraction and activity intake.
-- Creates private PENDING records only; it does not publish Local Data.
-- Read docs/PHASE_18_BATCH_007_ATTRACTION_INTAKE.md before execution.

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.destinations WHERE slug = 'pak-chong-khao-yai'
  ) THEN
    RAISE EXCEPTION 'Batch 007 stopped: destination pak-chong-khao-yai does not exist.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.places
    WHERE slug IN (
      'khao-yai-art-museum',
      'khao-yai-speedkart',
      'primo-piazza-khao-yai'
    )
  ) THEN
    RAISE EXCEPTION 'Batch 007 stopped: one or more candidate places already exist. Resolve duplicates before importing.';
  END IF;
END
$$;

INSERT INTO public.places (
  business_id,
  destination_id,
  place_type,
  name,
  slug,
  address,
  phone,
  publication_status,
  verification_status
)
SELECT
  NULL,
  d.id,
  c.place_type,
  c.name,
  c.slug,
  c.address,
  c.phone,
  'pending',
  'pending'
FROM public.destinations d
CROSS JOIN (
  VALUES
    ('attraction', 'Khao Yai Art Museum', 'khao-yai-art-museum', 'Ban Tha Chang Soi 6, Moo 16, Mu Si, Pak Chong, Nakhon Ratchasima, Thailand', NULL::text),
    ('activity', 'Khao Yai Speedkart', 'khao-yai-speedkart', NULL::text, NULL::text),
    ('attraction', 'Primo Piazza Khao Yai', 'primo-piazza-khao-yai', NULL::text, '081-922-9000')
) AS c(place_type, name, slug, address, phone)
WHERE d.slug = 'pak-chong-khao-yai';

-- Khao Yai Art Museum: official website states daily 09:00–17:00.
-- Khao Yai Speedkart: official operator post states daily 09:00–18:30.
-- Primo Piazza: no hours due conflicting official-page snippets.
INSERT INTO public.place_hours (
  place_id,
  day_of_week,
  open_time,
  close_time,
  is_closed,
  crosses_midnight
)
SELECT
  p.id,
  h.day_of_week,
  h.open_time,
  h.close_time,
  false,
  false
FROM public.places p
JOIN (
  VALUES
    ('khao-yai-art-museum', 0::smallint, '09:00:00'::time, '17:00:00'::time),
    ('khao-yai-art-museum', 1::smallint, '09:00:00'::time, '17:00:00'::time),
    ('khao-yai-art-museum', 2::smallint, '09:00:00'::time, '17:00:00'::time),
    ('khao-yai-art-museum', 3::smallint, '09:00:00'::time, '17:00:00'::time),
    ('khao-yai-art-museum', 4::smallint, '09:00:00'::time, '17:00:00'::time),
    ('khao-yai-art-museum', 5::smallint, '09:00:00'::time, '17:00:00'::time),
    ('khao-yai-art-museum', 6::smallint, '09:00:00'::time, '17:00:00'::time),
    ('khao-yai-speedkart', 0::smallint, '09:00:00'::time, '18:30:00'::time),
    ('khao-yai-speedkart', 1::smallint, '09:00:00'::time, '18:30:00'::time),
    ('khao-yai-speedkart', 2::smallint, '09:00:00'::time, '18:30:00'::time),
    ('khao-yai-speedkart', 3::smallint, '09:00:00'::time, '18:30:00'::time),
    ('khao-yai-speedkart', 4::smallint, '09:00:00'::time, '18:30:00'::time),
    ('khao-yai-speedkart', 5::smallint, '09:00:00'::time, '18:30:00'::time),
    ('khao-yai-speedkart', 6::smallint, '09:00:00'::time, '18:30:00'::time)
) AS h(slug, day_of_week, open_time, close_time)
  ON p.slug = h.slug;

INSERT INTO public.place_sources (
  place_id,
  source_type,
  source_url,
  source_note,
  checked_at,
  checked_by
)
SELECT
  p.id,
  s.source_type,
  s.source_url,
  s.source_note,
  '2026-09-19T16:00:00Z'::timestamptz,
  NULL
FROM public.places p
JOIN (
  VALUES
    ('khao-yai-art-museum', 'official_website', 'https://www.khaoyai-artmuseum.com/', 'Museum operator website: venue identity, Ban Tha Chang Soi 6 address and daily 09:00–17:00 hours.'),
    ('khao-yai-speedkart', 'official_social', 'https://www.facebook.com/Khaoyaispeedkart/posts/come-visit-our-new-atv-and-track-layout-%EF%B8%8Fat-khao-yai-speedkart%EF%B8%8F-open-everyday-90/1645035976956685/', 'Operator post: Speedkart/ATV activity identity and daily 09:00–18:30 hours.'),
    ('primo-piazza-khao-yai', 'official_social', 'https://www.facebook.com/PrimoPiazzaPage', 'Official Facebook identity and contact number. Hours are deliberately omitted until the conflicting page snippets are reconciled.')
) AS s(slug, source_type, source_url, source_note)
  ON p.slug = s.slug;

COMMIT;
