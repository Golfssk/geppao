-- Phase 18 / Consolidated Accommodation Data Pack 001
-- One guarded transaction for 20 source-backed accommodation curation records.
-- Creates PENDING records only; does not publish, update, or delete Local Data.
-- Read docs/PHASE_18_CONSOLIDATED_ACCOMMODATION_PACK_001.md before execution.

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.destinations WHERE slug = 'pak-chong-khao-yai'
  ) THEN
    RAISE EXCEPTION 'Accommodation Pack 001 stopped: destination pak-chong-khao-yai does not exist.';
  END IF;

  IF EXISTS (
    SELECT 1
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
    )
  ) THEN
    RAISE EXCEPTION 'Accommodation Pack 001 stopped: one or more candidate places already exist. Resolve duplicates before importing.';
  END IF;
END
$$;

INSERT INTO public.places (
  business_id, destination_id, place_type, name, slug, address, phone,
  latitude, longitude, publication_status, verification_status
)
SELECT
  NULL, d.id, 'accommodation', c.name, c.slug, c.address, c.phone,
  c.latitude, c.longitude, 'pending', 'pending'
FROM public.destinations d
CROSS JOIN (
  VALUES
    ('U Khao Yai', 'u-khao-yai', '99/22 Moo 1, Mu Si, Pak Chong, Nakhon Ratchasima 30130', '044-079-999', NULL::double precision, NULL::double precision),
    ('Splendid Hotel Khao Yai', 'splendid-hotel-khao-yai', '288 Moo 10 Kudkhla-Pansuek Road, Mu Si, Pak Chong, Nakhon Ratchasima 30130', '095-205-1819', NULL::double precision, NULL::double precision),
    ('Hotel Labaris Khao Yai', 'hotel-labaris-khao-yai', '9/9 Moo 4, Thanarat 16 kms Road, Mu Si, Pak Chong, Nakhon Ratchasima 30450', '063-190-1900', NULL::double precision, NULL::double precision),
    ('Hotel MYS Khao Yai', 'hotel-mys-khao-yai', '287 Moo 4, Mu Si Subdistrict, Pak Chong District, Nakhon Ratchasima 30450', NULL::text, NULL::double precision, NULL::double precision),
    ('Kirimaya The Resort', 'kirimaya-the-resort', '1/3 Moo 6, Thanarat Road, Mu Si, Pak Chong District, Nakhon Ratchasima 30130', '044-426-000', NULL::double precision, NULL::double precision),
    ('Mövenpick Resort Khao Yai', 'movenpick-resort-khao-yai', '334 Moo 6, Tambon Wang Sai, Amphoe Pak Chong, Nakhon Ratchasima 30130', '044-009-100', 14.674605::double precision, 101.577165::double precision),
    ('InterContinental Khao Yai Resort', 'intercontinental-khao-yai-resort', '262 Moo 6, Pong Ta Long, Pak Chong, Nakhon Ratchasima 30450', '044-082-039', NULL::double precision, NULL::double precision),
    ('Thames Valley Khao Yai', 'thames-valley-khao-yai', '999 Mu Si, Pak Chong District, Nakhon Ratchasima 30450', '044-009-999', NULL::double precision, NULL::double precision),
    ('Lala Mukha Tented Resort Khao Yai', 'lala-mukha-tented-resort-khao-yai', '515 Moo 5, Tambon Mu Si, Amphur Pak Chong, Nakhon Ratchasima 30450', '044-300-691', NULL::double precision, NULL::double precision),
    ('The Series Resort Khaoyai', 'the-series-resort-khaoyai', '161/1 Moo 3 Phansuk-Kudkla Road, Nong Nam Daeng, Pak Chong, Nakhon Ratchasima 30130', '044-081-222', NULL::double precision, NULL::double precision),
    ('Rancho Charnvee Resort & Country Club', 'rancho-charnvee-resort-country-club', '333/4 Moo 12, Khanong Phra, Pak Chong, Nakhon Ratchasima 30450', '044-756-210', NULL::double precision, NULL::double precision),
    ('Roukh Kiri Khaoyai, The Centara Collection', 'roukh-kiri-khaoyai', '10 Moo 4, Pong Ta Long, Pak Chong, Nakhon Ratchasima 30130', '044-001-300', NULL::double precision, NULL::double precision),
    ('dusitD2 Khao Yai', 'dusitd2-khao-yai', '678 Moo 18, Tambol Mu Si, Pak Chong District, Nakhon Ratchasima, Thailand', '044-003-000', NULL::double precision, NULL::double precision),
    ('Fortune Courtyard Hotel Khao Yai', 'fortune-courtyard-hotel-khao-yai', '499 Moo 4, Thanarat Road, Mu Si District, Pak Chong, Nakhon Ratchasima 30130', '044-071-616', NULL::double precision, NULL::double precision),
    ('Marasca Khao Yai', 'marasca-khao-yai', '87 Moo 5, Phaya Yen Subdistrict, Pak Chong District, Nakhon Ratchasima 30230', '044-003-640', NULL::double precision, NULL::double precision),
    ('Kensington English Garden Resort Khaoyai', 'kensington-english-garden-resort-khaoyai', '585, 585/1-3 Moo 5, Tambon Wang Katha, Amphoe Pak Chong, Nakhon Ratchasima 30130', '044-009-522', NULL::double precision, NULL::double precision),
    ('Muthi Maya Forest Pool Villa Resort', 'muthi-maya-forest-pool-villa-resort', '1/3 Moo 6, Thanarat Road, Mu Si, Pak Chong District, Nakhon Ratchasima 30130', '044-426-000', NULL::double precision, NULL::double precision),
    ('Atta Lakeside Resort Suite', 'atta-lakeside-resort-suite', '1/3 Moo 6, Thanarat Road, Mu Si, Pak Chong District, Nakhon Ratchasima 30130', '044-426-000', NULL::double precision, NULL::double precision),
    ('Parco Hotel Khaoyai', 'parco-hotel-khaoyai', '236 Moo 11, Thanarat Road, Tambon Khanong Phra, Pak Chong, Nakhon Ratchasima 30130', '091-116-1818', NULL::double precision, NULL::double precision),
    ('Le Monte Hotel Khao Yai', 'le-monte-hotel-khao-yai', '882 Moo 5, Thanarat Road, Mu Si, Pak Chong, Nakhon Ratchasima 30130', '044-077-770', NULL::double precision, NULL::double precision)
) AS c(name, slug, address, phone, latitude, longitude)
WHERE d.slug = 'pak-chong-khao-yai';

INSERT INTO public.place_sources (
  place_id, source_type, source_url, source_note, checked_at, checked_by
)
SELECT
  p.id, 'official_website', s.source_url, s.source_note,
  '2026-09-19T16:00:00Z'::timestamptz, NULL
FROM public.places p
JOIN (
  VALUES
    ('u-khao-yai', 'https://www.uhotelsresorts.com/ukhaoyai/contact', 'Official property contact page: identity, address and phone.'),
    ('splendid-hotel-khao-yai', 'https://www.splendidkhaoyai.com/', 'Official property website: identity, address and phone.'),
    ('hotel-labaris-khao-yai', 'https://www.hotellabaris.com/en', 'Official property website: identity, address and reservation phone.'),
    ('hotel-mys-khao-yai', 'https://www.hotelmys.com/', 'Official property website: identity and address.'),
    ('kirimaya-the-resort', 'https://www.kirimaya.com/contact', 'Official property contact page: identity, address and phone.'),
    ('movenpick-resort-khao-yai', 'https://movenpick.accor.com/en/asia/thailand/khao-yai/resort-khao-yai.html', 'Official operator page: identity, address, phone and coordinates 14.674605, 101.577165.'),
    ('intercontinental-khao-yai-resort', 'https://khaoyai.intercontinental.com/contact/', 'Official property contact page: identity, address and phone.'),
    ('thames-valley-khao-yai', 'https://www.thamesvalleykhaoyai.com/', 'Official property website: identity, address and phone.'),
    ('lala-mukha-tented-resort-khao-yai', 'https://lalamukha.com/', 'Official property website: identity, address and phone.'),
    ('the-series-resort-khaoyai', 'https://www.theseriesresort.com/', 'Official property website: identity, address and phone.'),
    ('rancho-charnvee-resort-country-club', 'https://www.charnveeresortkhaoyai.com/contact/', 'Official property contact page: identity, address and hotel phone.'),
    ('roukh-kiri-khaoyai', 'https://www.centarahotelsresorts.com/the-centara-collection/rkk', 'Official operator page: identity, address and phone.'),
    ('dusitd2-khao-yai', 'https://www.dusit.com/dusitd2-khaoyai/contact-us/', 'Official property contact page: identity, address and phone.'),
    ('fortune-courtyard-hotel-khao-yai', 'https://www.fortunehotelgroup.com/fortune-courtyard-khaoyai/en', 'Official property website: identity, address and phone.'),
    ('marasca-khao-yai', 'https://marasca.live/activity/khao-yai-national-park', 'Official property site: identity, address and phone.'),
    ('kensington-english-garden-resort-khaoyai', 'https://kensingtonresort-khaoyai.com/conference-halls', 'Official property page: identity, address and front-desk phone.'),
    ('muthi-maya-forest-pool-villa-resort', 'https://www.kirimaya.com/resorts/muthimaya/', 'Official operator page: identity; Kirimaya group contact provides shared address and phone.'),
    ('atta-lakeside-resort-suite', 'https://www.kirimaya.com/resorts/atta', 'Official operator page: identity, shared resort address and phone.'),
    ('parco-hotel-khaoyai', 'https://parcohotelkhaoyai.thebonanzakhaoyai.com/home-en/', 'Official property page: identity, address and reservation phone.'),
    ('le-monte-hotel-khao-yai', 'https://lemontekhaoyai.com/accommodation.php', 'Official property page: identity, address and phone.')
) AS s(slug, source_url, source_note)
  ON p.slug = s.slug;

COMMIT;
