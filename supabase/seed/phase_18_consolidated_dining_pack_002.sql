-- Phase 18 / Consolidated Dining Data Pack 002
-- Idempotent source-backed intake for 20 restaurant/cafe Places.
-- Existing slugs are skipped without modification. New records remain PENDING.
-- Read docs/PHASE_18_CONSOLIDATED_DINING_PACK_002.md before execution.

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.destinations WHERE slug = 'pak-chong-khao-yai') THEN
    RAISE EXCEPTION 'Dining Pack 002 stopped: destination pak-chong-khao-yai does not exist.';
  END IF;
END
$$;

WITH candidates (
  place_type, name, slug, address, phone, source_type, source_url, source_note
) AS (
  VALUES
    ('restaurant', 'Midwinter Khao Yai', 'midwinter-khao-yai', '88/88 Moo 10, Thanarat Road, Nong Nam Daeng, Pak Chong, Nakhon Ratchasima 30130', '082-452-8888', 'official_website', 'https://www.midwinterkhaoyai.com/en/contact-us', 'Official operator contact page: identity, address and phone.'),
    ('restaurant', 'The Castle Restaurant and Tea Room', 'the-castle-restaurant-and-tea-room', '999 Mu Si, Pak Chong District, Nakhon Ratchasima 30450', NULL::text, 'official_website', 'https://www.thamesvalleykhaoyai.com/restaurant/the-castle-restaurant-and-tea-room/', 'Official hotel venue page: identity and parent-hotel address. Service windows are not simplified into one interval.'),
    ('restaurant', 'Prime 19 Khao Yai', 'prime-19-khao-yai', '777 Moo 5, Scenical World Khao Yai, Nakhon Ratchasima', '084-976-9467', 'official_social', 'https://www.facebook.com/prime19khaoyai/', 'Official Facebook page: identity, address and phone.'),
    ('restaurant', 'The Witches Brew Restaurant Khao Yai', 'the-witches-brew-restaurant-khao-yai', '72 Thanarat Road, Mu Si, Pak Chong, Nakhon Ratchasima', '093-639-4695', 'official_social', 'https://www.facebook.com/p/The-Witches-Brew-Restaurant-Khao-Yai-100063777901100/', 'Official Facebook page: identity, address and phone.'),
    ('restaurant', 'Banmai Chay Nam Pak Chong', 'banmai-chay-nam-pak-chong', NULL::text, '081-660-2826', 'official_social', 'https://www.facebook.com/banmaichaynampakchong/', 'Official Facebook page: identity, phone and daily 09:00–21:00 hours.'),
    ('cafe', 'Yellowsubmarine Coffee', 'yellowsubmarine-coffee', NULL::text, NULL::text, 'official_social', 'https://www.instagram.com/yellowsubmarine_coffee/', 'Official Instagram profile: identity and Friday 09:00–19:00 opening statement.'),
    ('cafe', 'The Birder''s Lodge Cafe', 'the-birders-lodge-cafe', '110 Moo 10, Mu Si, Pak Chong, Nakhon Ratchasima', '044-002-306', 'official_website', 'https://www.thebirderslodge.com/', 'Official operator website: identity, address and phone.'),
    ('cafe', 'Please Don''t Tell Khaoyai', 'please-dont-tell-khaoyai', NULL::text, '082-959-2979', 'official_social', 'https://www.facebook.com/PleaseDontTellKhoayai/', 'Official Facebook page: identity and phone.'),
    ('cafe', 'Like A Mountain Khao Yai', 'like-a-mountain-khao-yai', NULL::text, '085-495-5075', 'official_social', 'https://www.facebook.com/100075921802080/', 'Official Facebook page: identity, phone and daily 09:00–17:00 hours.'),
    ('cafe', 'Baankhaofae Farm Eatery & Coffee', 'baankhaofae-farm-eatery-coffee', NULL::text, NULL::text, 'official_social', 'https://www.facebook.com/baankhaofae/', 'Official Facebook page: identity. Weekly schedule wording is incomplete, so no hours are stored.'),
    ('cafe', 'The Creek Khao Yai', 'the-creek-khao-yai', '104/4 Mittraphap Road, Soi Thetsaban 26, Pak Chong, Nakhon Ratchasima 30130', '089-945-3125', 'official_social', 'https://www.facebook.com/TheCreekKhaoYai/', 'Official Facebook page: identity, address and phone. No complete weekly schedule stored.'),
    ('cafe', 'Olna Khaoyai', 'olna-khaoyai', NULL::text, '065-041-0835', 'official_social', 'https://www.facebook.com/OlnaxPYRoasters/', 'Official Facebook page: identity, phone and daily 08:30–17:00 hours.'),
    ('restaurant', 'Flavours of Khao Yai', 'flavours-of-khao-yai', '334 Moo 6, Tambon Wang Sai, Amphoe Pak Chong, Nakhon Ratchasima 30130', NULL::text, 'official_website', 'https://www.movenpickresortkhaoyai.com/dining/flavours-of-khao-yai/', 'Official hotel venue page: identity, parent-hotel address and daily 06:00–23:00 hours.'),
    ('restaurant', 'Sapori Cucina', 'sapori-cucina-khao-yai', '334 Moo 6, Tambon Wang Sai, Amphoe Pak Chong, Nakhon Ratchasima 30130', NULL::text, 'official_website', 'https://www.movenpickresortkhaoyai.com/dining/sapori-cucina/', 'Official hotel venue page: identity, parent-hotel address and daily 17:00–23:00 hours.'),
    ('cafe', 'Castleton Café', 'castleton-cafe-khao-yai', '334 Moo 6, Tambon Wang Sai, Amphoe Pak Chong, Nakhon Ratchasima 30130', NULL::text, 'official_website', 'https://www.movenpickresortkhaoyai.com/dining/castleton-cafe/', 'Official hotel venue page: identity, parent-hotel address and daily 10:00–18:00 hours.'),
    ('restaurant', 'Acala Restaurant', 'acala-restaurant-khao-yai', '1/3 Moo 6, Thanarat Road, Mu Si, Pak Chong District, Nakhon Ratchasima 30130', NULL::text, 'official_website', 'https://www.kirimaya.com/dining/kirimaya-acala-restaurant/', 'Official hotel venue page: identity, parent-hotel address and split service windows; no simplified hours stored.'),
    ('restaurant', 'TANI Restaurant', 'tani-restaurant-khao-yai', '1/3 Moo 6, Thanarat Road, Mu Si, Pak Chong District, Nakhon Ratchasima 30130', NULL::text, 'official_website', 'https://www.kirimaya.com/dining/atta-tani-restaurant/', 'Official hotel venue page: identity, parent-hotel address and split service windows; no simplified hours stored.'),
    ('restaurant', 'Cha La Restaurant & Bar', 'cha-la-restaurant-bar-khao-yai', '287 Moo 4, Mu Si Subdistrict, Pak Chong District, Nakhon Ratchasima 30450', NULL::text, 'official_website', 'https://www.hotelmys.com/', 'Official hotel venue page: identity, parent-hotel address and daily 07:00–23:00 service coverage.'),
    ('restaurant', 'The Fable Feast', 'the-fable-feast-khao-yai', '9/9 Moo 4, Thanarat 16 kms Road, Mu Si, Pak Chong, Nakhon Ratchasima 30450', NULL::text, 'official_website', 'https://www.hotellabaris.com/facility/the-fable-feast/', 'Official hotel venue page: identity, parent-hotel address and daily 11:00–22:00 hours.'),
    ('cafe', 'Clotted Cream Tea Room', 'clotted-cream-tea-room-khao-yai', '999 Mu Si, Pak Chong District, Nakhon Ratchasima 30450', NULL::text, 'official_website', 'https://www.thamesvalleykhaoyai.com/restaurant/clotted-cream-tea-room', 'Official hotel venue page: identity, parent-hotel address and daily 11:00–17:00 hours.')
), inserted AS (
  INSERT INTO public.places (
    business_id, destination_id, place_type, name, slug, address, phone,
    publication_status, verification_status
  )
  SELECT NULL, d.id, c.place_type, c.name, c.slug, c.address, c.phone, 'pending', 'pending'
  FROM candidates c
  CROSS JOIN public.destinations d
  WHERE d.slug = 'pak-chong-khao-yai'
  ON CONFLICT (slug) DO NOTHING
  RETURNING id, slug
), inserted_sources AS (
  INSERT INTO public.place_sources (
    place_id, source_type, source_url, source_note, checked_at, checked_by
  )
  SELECT i.id, c.source_type, c.source_url, c.source_note,
         '2026-09-19T16:00:00Z'::timestamptz, NULL
  FROM inserted i
  JOIN candidates c ON c.slug = i.slug
  RETURNING place_id
), hours(slug, day_of_week, open_time, close_time) AS (
  VALUES
    ('banmai-chay-nam-pak-chong', 0::smallint, '09:00:00'::time, '21:00:00'::time),
    ('banmai-chay-nam-pak-chong', 1::smallint, '09:00:00'::time, '21:00:00'::time),
    ('banmai-chay-nam-pak-chong', 2::smallint, '09:00:00'::time, '21:00:00'::time),
    ('banmai-chay-nam-pak-chong', 3::smallint, '09:00:00'::time, '21:00:00'::time),
    ('banmai-chay-nam-pak-chong', 4::smallint, '09:00:00'::time, '21:00:00'::time),
    ('banmai-chay-nam-pak-chong', 5::smallint, '09:00:00'::time, '21:00:00'::time),
    ('banmai-chay-nam-pak-chong', 6::smallint, '09:00:00'::time, '21:00:00'::time),
    ('yellowsubmarine-coffee', 5::smallint, '09:00:00'::time, '19:00:00'::time),
    ('like-a-mountain-khao-yai', 0::smallint, '09:00:00'::time, '17:00:00'::time), ('like-a-mountain-khao-yai', 1::smallint, '09:00:00'::time, '17:00:00'::time), ('like-a-mountain-khao-yai', 2::smallint, '09:00:00'::time, '17:00:00'::time), ('like-a-mountain-khao-yai', 3::smallint, '09:00:00'::time, '17:00:00'::time), ('like-a-mountain-khao-yai', 4::smallint, '09:00:00'::time, '17:00:00'::time), ('like-a-mountain-khao-yai', 5::smallint, '09:00:00'::time, '17:00:00'::time), ('like-a-mountain-khao-yai', 6::smallint, '09:00:00'::time, '17:00:00'::time),
    ('olna-khaoyai', 0::smallint, '08:30:00'::time, '17:00:00'::time), ('olna-khaoyai', 1::smallint, '08:30:00'::time, '17:00:00'::time), ('olna-khaoyai', 2::smallint, '08:30:00'::time, '17:00:00'::time), ('olna-khaoyai', 3::smallint, '08:30:00'::time, '17:00:00'::time), ('olna-khaoyai', 4::smallint, '08:30:00'::time, '17:00:00'::time), ('olna-khaoyai', 5::smallint, '08:30:00'::time, '17:00:00'::time), ('olna-khaoyai', 6::smallint, '08:30:00'::time, '17:00:00'::time),
    ('flavours-of-khao-yai', 0::smallint, '06:00:00'::time, '23:00:00'::time), ('flavours-of-khao-yai', 1::smallint, '06:00:00'::time, '23:00:00'::time), ('flavours-of-khao-yai', 2::smallint, '06:00:00'::time, '23:00:00'::time), ('flavours-of-khao-yai', 3::smallint, '06:00:00'::time, '23:00:00'::time), ('flavours-of-khao-yai', 4::smallint, '06:00:00'::time, '23:00:00'::time), ('flavours-of-khao-yai', 5::smallint, '06:00:00'::time, '23:00:00'::time), ('flavours-of-khao-yai', 6::smallint, '06:00:00'::time, '23:00:00'::time),
    ('sapori-cucina-khao-yai', 0::smallint, '17:00:00'::time, '23:00:00'::time), ('sapori-cucina-khao-yai', 1::smallint, '17:00:00'::time, '23:00:00'::time), ('sapori-cucina-khao-yai', 2::smallint, '17:00:00'::time, '23:00:00'::time), ('sapori-cucina-khao-yai', 3::smallint, '17:00:00'::time, '23:00:00'::time), ('sapori-cucina-khao-yai', 4::smallint, '17:00:00'::time, '23:00:00'::time), ('sapori-cucina-khao-yai', 5::smallint, '17:00:00'::time, '23:00:00'::time), ('sapori-cucina-khao-yai', 6::smallint, '17:00:00'::time, '23:00:00'::time),
    ('castleton-cafe-khao-yai', 0::smallint, '10:00:00'::time, '18:00:00'::time), ('castleton-cafe-khao-yai', 1::smallint, '10:00:00'::time, '18:00:00'::time), ('castleton-cafe-khao-yai', 2::smallint, '10:00:00'::time, '18:00:00'::time), ('castleton-cafe-khao-yai', 3::smallint, '10:00:00'::time, '18:00:00'::time), ('castleton-cafe-khao-yai', 4::smallint, '10:00:00'::time, '18:00:00'::time), ('castleton-cafe-khao-yai', 5::smallint, '10:00:00'::time, '18:00:00'::time), ('castleton-cafe-khao-yai', 6::smallint, '10:00:00'::time, '18:00:00'::time),
    ('cha-la-restaurant-bar-khao-yai', 0::smallint, '07:00:00'::time, '23:00:00'::time), ('cha-la-restaurant-bar-khao-yai', 1::smallint, '07:00:00'::time, '23:00:00'::time), ('cha-la-restaurant-bar-khao-yai', 2::smallint, '07:00:00'::time, '23:00:00'::time), ('cha-la-restaurant-bar-khao-yai', 3::smallint, '07:00:00'::time, '23:00:00'::time), ('cha-la-restaurant-bar-khao-yai', 4::smallint, '07:00:00'::time, '23:00:00'::time), ('cha-la-restaurant-bar-khao-yai', 5::smallint, '07:00:00'::time, '23:00:00'::time), ('cha-la-restaurant-bar-khao-yai', 6::smallint, '07:00:00'::time, '23:00:00'::time),
    ('the-fable-feast-khao-yai', 0::smallint, '11:00:00'::time, '22:00:00'::time), ('the-fable-feast-khao-yai', 1::smallint, '11:00:00'::time, '22:00:00'::time), ('the-fable-feast-khao-yai', 2::smallint, '11:00:00'::time, '22:00:00'::time), ('the-fable-feast-khao-yai', 3::smallint, '11:00:00'::time, '22:00:00'::time), ('the-fable-feast-khao-yai', 4::smallint, '11:00:00'::time, '22:00:00'::time), ('the-fable-feast-khao-yai', 5::smallint, '11:00:00'::time, '22:00:00'::time), ('the-fable-feast-khao-yai', 6::smallint, '11:00:00'::time, '22:00:00'::time),
    ('clotted-cream-tea-room-khao-yai', 0::smallint, '11:00:00'::time, '17:00:00'::time), ('clotted-cream-tea-room-khao-yai', 1::smallint, '11:00:00'::time, '17:00:00'::time), ('clotted-cream-tea-room-khao-yai', 2::smallint, '11:00:00'::time, '17:00:00'::time), ('clotted-cream-tea-room-khao-yai', 3::smallint, '11:00:00'::time, '17:00:00'::time), ('clotted-cream-tea-room-khao-yai', 4::smallint, '11:00:00'::time, '17:00:00'::time), ('clotted-cream-tea-room-khao-yai', 5::smallint, '11:00:00'::time, '17:00:00'::time), ('clotted-cream-tea-room-khao-yai', 6::smallint, '11:00:00'::time, '17:00:00'::time)
)
INSERT INTO public.place_hours (place_id, day_of_week, open_time, close_time, is_closed, crosses_midnight)
SELECT i.id, h.day_of_week, h.open_time, h.close_time, false, false
FROM inserted i
JOIN hours h ON h.slug = i.slug;

COMMIT;
