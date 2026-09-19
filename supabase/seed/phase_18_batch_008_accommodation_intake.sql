-- Phase 18 / Batch 008
-- Source-backed accommodation curation intake.
-- Creates private PENDING records only. It does not publish Local Data.
-- Read docs/PHASE_18_BATCH_008_ACCOMMODATION_INTAKE.md before execution.

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.destinations WHERE slug = 'pak-chong-khao-yai'
  ) THEN
    RAISE EXCEPTION 'Batch 008 stopped: destination pak-chong-khao-yai does not exist.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.places
    WHERE slug IN (
      'u-khao-yai',
      'splendid-hotel-khao-yai',
      'hotel-labaris-khao-yai',
      'hotel-mys-khao-yai',
      'kirimaya-the-resort',
      'movenpick-resort-khao-yai'
    )
  ) THEN
    RAISE EXCEPTION 'Batch 008 stopped: one or more candidate places already exist. Resolve duplicates before importing.';
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
  latitude,
  longitude,
  publication_status,
  verification_status
)
SELECT
  NULL,
  d.id,
  'accommodation',
  c.name,
  c.slug,
  c.address,
  c.phone,
  c.latitude,
  c.longitude,
  'pending',
  'pending'
FROM public.destinations d
CROSS JOIN (
  VALUES
    ('U Khao Yai', 'u-khao-yai', '99/22 Moo 1, Mu Si, Pak Chong, Nakhon Ratchasima 30130', '044-079-999', NULL::double precision, NULL::double precision),
    ('Splendid Hotel Khao Yai', 'splendid-hotel-khao-yai', '288 Moo 10 Kudkhla-Pansuek Road, Mu Si, Pak Chong, Nakhon Ratchasima 30130', '095-205-1819', NULL::double precision, NULL::double precision),
    ('Hotel Labaris Khao Yai', 'hotel-labaris-khao-yai', '9/9 Moo 4, Thanarat 16 kms Road, Mu Si, Pak Chong, Nakhon Ratchasima 30450', '063-190-1900', NULL::double precision, NULL::double precision),
    ('Hotel MYS Khao Yai', 'hotel-mys-khao-yai', '287 Moo 4, Mu Si Subdistrict, Pak Chong District, Nakhon Ratchasima 30450', NULL::text, NULL::double precision, NULL::double precision),
    ('Kirimaya The Resort', 'kirimaya-the-resort', '1/3 Moo 6, Thanarat Road, Mu Si, Pak Chong District, Nakhon Ratchasima 30130', '044-426-000', NULL::double precision, NULL::double precision),
    ('Mövenpick Resort Khao Yai', 'movenpick-resort-khao-yai', '334 Moo 6, Tambon Wang Sai, Amphoe Pak Chong, Nakhon Ratchasima 30130', '044-009-100', 14.674605::double precision, 101.577165::double precision)
) AS c(name, slug, address, phone, latitude, longitude)
WHERE d.slug = 'pak-chong-khao-yai';

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
    ('u-khao-yai', 'official_website', 'https://www.uhotelsresorts.com/ukhaoyai', 'Official property website: venue identity, 99/22 Moo 1 Mu Si address and phone.'),
    ('splendid-hotel-khao-yai', 'official_website', 'https://www.splendidkhaoyai.com/', 'Official property website: venue identity, 288 Moo 10 Kudkhla-Pansuek Road address and phone.'),
    ('hotel-labaris-khao-yai', 'official_website', 'https://www.hotellabaris.com/en', 'Official property website: venue identity, 9/9 Moo 4 Thanarat 16 kms Road address and reservation phone.'),
    ('hotel-mys-khao-yai', 'official_website', 'https://www.hotelmys.com/', 'Official property website: venue identity and 287 Moo 4 Mu Si address.'),
    ('kirimaya-the-resort', 'official_website', 'https://www.kirimaya.com/contact', 'Official property website: venue identity, 1/3 Moo 6 Thanarat Road address and phone.'),
    ('movenpick-resort-khao-yai', 'official_website', 'https://movenpick.accor.com/en/asia/thailand/khao-yai/resort-khao-yai.html', 'Official operator website: venue identity, address, phone and numeric coordinates 14.674605, 101.577165.')
) AS s(slug, source_type, source_url, source_note)
  ON p.slug = s.slug;

COMMIT;
