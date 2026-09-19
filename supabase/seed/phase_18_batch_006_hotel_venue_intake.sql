-- Phase 18 / Batch 006
-- Source-backed curation intake for independently visitable hotel dining venues.
-- Creates private PENDING records only. It does not publish Local Data.
-- Read docs/PHASE_18_BATCH_006_HOTEL_VENUE_INTAKE.md before execution.

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.destinations
    WHERE slug = 'pak-chong-khao-yai'
  ) THEN
    RAISE EXCEPTION 'Batch 006 stopped: destination pak-chong-khao-yai does not exist.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.places
    WHERE slug IN (
      'lacol-dome-dining',
      'journey-cafe-bar-lacol-khao-yai',
      'audrey-lacol-khao-yai',
      'raleuk-khaoyai',
      'poirot-intercontinental-khao-yai',
      'tea-carriage-intercontinental-khao-yai',
      'somyings-kitchen-intercontinental-khao-yai'
    )
  ) THEN
    RAISE EXCEPTION 'Batch 006 stopped: one or more candidate places already exist. Resolve duplicates before importing.';
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
  reservation_required,
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
  c.reservation_required,
  'pending',
  'pending'
FROM public.destinations d
CROSS JOIN (
  VALUES
    ('restaurant', 'Lacol Dome Dining', 'lacol-dome-dining', '369 Moo 4 Tanarat Road, Tambon Mu Si, Amphoe Pak Chong, Nakhon Ratchasima 30450', false),
    ('cafe', 'Journey Café & Bar', 'journey-cafe-bar-lacol-khao-yai', '369 Moo 4 Tanarat Road, Tambon Mu Si, Amphoe Pak Chong, Nakhon Ratchasima 30450', false),
    ('restaurant', 'Audrey', 'audrey-lacol-khao-yai', '369 Moo 4 Tanarat Road, Tambon Mu Si, Amphoe Pak Chong, Nakhon Ratchasima 30450', false),
    ('restaurant', 'Raleuk Khaoyai', 'raleuk-khaoyai', '369 Moo 4 Tanarat Road, Tambon Mu Si, Amphoe Pak Chong, Nakhon Ratchasima 30450', false),
    ('restaurant', 'Poirot', 'poirot-intercontinental-khao-yai', '262 Moo 6, Pong-Talong, Pak Chong, Nakhon Ratchasima 30450', true),
    ('cafe', 'Tea Carriage', 'tea-carriage-intercontinental-khao-yai', '262 Moo 6, Pong-Talong, Pak Chong, Nakhon Ratchasima 30450', true),
    ('restaurant', 'Somying’s Kitchen', 'somyings-kitchen-intercontinental-khao-yai', '262 Moo 6, Pong-Talong, Pak Chong, Nakhon Ratchasima 30450', false)
) AS c(place_type, name, slug, address, reservation_required)
WHERE d.slug = 'pak-chong-khao-yai';

-- Only hours representable as one truthful interval per day are stored.
-- Somying’s Kitchen has split service windows and is intentionally omitted.
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
  h.is_closed,
  false
FROM public.places p
JOIN (
  VALUES
    -- Lacol Dome Dining: daily 17:00–22:00.
    ('lacol-dome-dining', 0::smallint, '17:00:00'::time, '22:00:00'::time, false),
    ('lacol-dome-dining', 1::smallint, '17:00:00'::time, '22:00:00'::time, false),
    ('lacol-dome-dining', 2::smallint, '17:00:00'::time, '22:00:00'::time, false),
    ('lacol-dome-dining', 3::smallint, '17:00:00'::time, '22:00:00'::time, false),
    ('lacol-dome-dining', 4::smallint, '17:00:00'::time, '22:00:00'::time, false),
    ('lacol-dome-dining', 5::smallint, '17:00:00'::time, '22:00:00'::time, false),
    ('lacol-dome-dining', 6::smallint, '17:00:00'::time, '22:00:00'::time, false),
    -- Journey Café & Bar: daily 09:00–22:00.
    ('journey-cafe-bar-lacol-khao-yai', 0::smallint, '09:00:00'::time, '22:00:00'::time, false),
    ('journey-cafe-bar-lacol-khao-yai', 1::smallint, '09:00:00'::time, '22:00:00'::time, false),
    ('journey-cafe-bar-lacol-khao-yai', 2::smallint, '09:00:00'::time, '22:00:00'::time, false),
    ('journey-cafe-bar-lacol-khao-yai', 3::smallint, '09:00:00'::time, '22:00:00'::time, false),
    ('journey-cafe-bar-lacol-khao-yai', 4::smallint, '09:00:00'::time, '22:00:00'::time, false),
    ('journey-cafe-bar-lacol-khao-yai', 5::smallint, '09:00:00'::time, '22:00:00'::time, false),
    ('journey-cafe-bar-lacol-khao-yai', 6::smallint, '09:00:00'::time, '22:00:00'::time, false),
    -- Audrey: daily 07:00–22:00.
    ('audrey-lacol-khao-yai', 0::smallint, '07:00:00'::time, '22:00:00'::time, false),
    ('audrey-lacol-khao-yai', 1::smallint, '07:00:00'::time, '22:00:00'::time, false),
    ('audrey-lacol-khao-yai', 2::smallint, '07:00:00'::time, '22:00:00'::time, false),
    ('audrey-lacol-khao-yai', 3::smallint, '07:00:00'::time, '22:00:00'::time, false),
    ('audrey-lacol-khao-yai', 4::smallint, '07:00:00'::time, '22:00:00'::time, false),
    ('audrey-lacol-khao-yai', 5::smallint, '07:00:00'::time, '22:00:00'::time, false),
    ('audrey-lacol-khao-yai', 6::smallint, '07:00:00'::time, '22:00:00'::time, false),
    -- Raleuk: 11:00–22:00 except Tuesday closed.
    ('raleuk-khaoyai', 0::smallint, '11:00:00'::time, '22:00:00'::time, false),
    ('raleuk-khaoyai', 1::smallint, '11:00:00'::time, '22:00:00'::time, false),
    ('raleuk-khaoyai', 2::smallint, NULL::time, NULL::time, true),
    ('raleuk-khaoyai', 3::smallint, '11:00:00'::time, '22:00:00'::time, false),
    ('raleuk-khaoyai', 4::smallint, '11:00:00'::time, '22:00:00'::time, false),
    ('raleuk-khaoyai', 5::smallint, '11:00:00'::time, '22:00:00'::time, false),
    ('raleuk-khaoyai', 6::smallint, '11:00:00'::time, '22:00:00'::time, false),
    -- Poirot: 18:00–23:00 except Wednesday closed.
    ('poirot-intercontinental-khao-yai', 0::smallint, '18:00:00'::time, '23:00:00'::time, false),
    ('poirot-intercontinental-khao-yai', 1::smallint, '18:00:00'::time, '23:00:00'::time, false),
    ('poirot-intercontinental-khao-yai', 2::smallint, '18:00:00'::time, '23:00:00'::time, false),
    ('poirot-intercontinental-khao-yai', 3::smallint, NULL::time, NULL::time, true),
    ('poirot-intercontinental-khao-yai', 4::smallint, '18:00:00'::time, '23:00:00'::time, false),
    ('poirot-intercontinental-khao-yai', 5::smallint, '18:00:00'::time, '23:00:00'::time, false),
    ('poirot-intercontinental-khao-yai', 6::smallint, '18:00:00'::time, '23:00:00'::time, false),
    -- Tea Carriage: 11:00–18:00 except Tuesday closed.
    ('tea-carriage-intercontinental-khao-yai', 0::smallint, '11:00:00'::time, '18:00:00'::time, false),
    ('tea-carriage-intercontinental-khao-yai', 1::smallint, '11:00:00'::time, '18:00:00'::time, false),
    ('tea-carriage-intercontinental-khao-yai', 2::smallint, NULL::time, NULL::time, true),
    ('tea-carriage-intercontinental-khao-yai', 3::smallint, '11:00:00'::time, '18:00:00'::time, false),
    ('tea-carriage-intercontinental-khao-yai', 4::smallint, '11:00:00'::time, '18:00:00'::time, false),
    ('tea-carriage-intercontinental-khao-yai', 5::smallint, '11:00:00'::time, '18:00:00'::time, false),
    ('tea-carriage-intercontinental-khao-yai', 6::smallint, '11:00:00'::time, '18:00:00'::time, false)
) AS h(slug, day_of_week, open_time, close_time, is_closed)
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
    ('lacol-dome-dining', 'official_website', 'https://www.chatrium.com/lacolkhaoyai/experiences/dine', 'Hotel operator source: venue identity, hotel address and daily 17:00–22:00 hours.'),
    ('journey-cafe-bar-lacol-khao-yai', 'official_website', 'https://www.chatrium.com/lacolkhaoyai/experiences/dine', 'Hotel operator source: venue identity, hotel address and daily 09:00–22:00 hours.'),
    ('audrey-lacol-khao-yai', 'official_website', 'https://www.chatrium.com/lacolkhaoyai/experiences/dine', 'Hotel operator source: venue identity, hotel address and daily 07:00–22:00 hours.'),
    ('raleuk-khaoyai', 'official_website', 'https://www.chatrium.com/lacolkhaoyai/experiences/dine', 'Hotel operator source: venue identity, hotel address, 11:00–22:00 hours and Tuesday closure.'),
    ('poirot-intercontinental-khao-yai', 'official_website', 'https://khaoyai.intercontinental.com/dining', 'Hotel operator source: venue identity, 18:00–23:00 hours, Wednesday closure, and advance reservation requirement for non-residents.'),
    ('poirot-intercontinental-khao-yai', 'official_website', 'https://khaoyai.intercontinental.com/', 'Hotel operator source: InterContinental Khao Yai address.'),
    ('tea-carriage-intercontinental-khao-yai', 'official_website', 'https://khaoyai.intercontinental.com/dining', 'Hotel operator source: venue identity, 11:00–18:00 hours, Tuesday closure, and advance reservation requirement for non-residents.'),
    ('tea-carriage-intercontinental-khao-yai', 'official_website', 'https://khaoyai.intercontinental.com/', 'Hotel operator source: InterContinental Khao Yai address.'),
    ('somyings-kitchen-intercontinental-khao-yai', 'official_website', 'https://khaoyai.intercontinental.com/dining', 'Hotel operator source: venue identity and split breakfast, lunch and dinner windows. No simplified hours were stored.'),
    ('somyings-kitchen-intercontinental-khao-yai', 'official_website', 'https://khaoyai.intercontinental.com/', 'Hotel operator source: InterContinental Khao Yai address.')
) AS s(slug, source_type, source_url, source_note)
  ON p.slug = s.slug;

COMMIT;
