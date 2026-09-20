-- Phase 18 / Batch 002
-- Source-backed curation intake for 15 held candidates.
-- This script creates private PENDING records only; it does not publish Local Data.
-- See docs/PHASE_18_BATCH_002_SOURCE_INTAKE.md before execution.
-- Research checked: 2026-09-19T14:00:00Z

begin;

do $$
begin
  if not exists (
    select 1 from public.destinations where slug = 'pak-chong-khao-yai'
  ) then
    raise exception 'Batch 002 stopped: destination pak-chong-khao-yai does not exist.';
  end if;

  if exists (
    select 1
    from public.places
    where slug in (
      'steak-in-khao-yai',
      'kua-kampan-khao-yai',
      'klua-jan-pha',
      'khrua-binla',
      'coffee-terrace-pak-chong',
      'lookkai-cafe-restaurant-khao-yai',
      'granmonte-vineyard-winery',
      'papillon-u-khao-yai',
      'khao-yai-art-tree-cafe',
      'khao-yai-art-tree-restaurant',
      'khao-yai-national-park',
      'bucolic-x-khaoyai-cafe',
      'rabbit-cafe-hotel-labaris',
      'klang-pana-roses-garden-cafe',
      'campfire-cafe-khao-yai'
    )
    or lower(name) in (
      'steak in khao yai',
      'kua kampan khao yai',
      'klua jan pha',
      'khrua binla',
      'coffee terrace',
      'lookkai cafe restaurant khao yai',
      'granmonte vineyard & winery',
      'papillon',
      'khao yai art tree café',
      'khao yai art tree restaurant',
      'khao yai national park',
      'bu•co•lic x khaoyai café',
      'rabbit café at hotel labaris',
      'klang pana roses garden & café',
      'campfire café khao yai'
    )
  ) then
    raise exception 'Batch 002 stopped: one or more candidate places already exist. Resolve duplicates before importing.';
  end if;
end $$;

insert into public.places (
  business_id,
  destination_id,
  place_type,
  name,
  slug,
  address,
  latitude,
  longitude,
  publication_status,
  verification_status
)
select
  null,
  d.id,
  c.place_type,
  c.name,
  c.slug,
  c.address,
  c.latitude,
  c.longitude,
  'pending',
  'pending'
from public.destinations d
cross join (
  values
    -- Government record + official Facebook identity/address. No hours due source conflict.
    ('restaurant', 'Steak In Khao Yai', 'steak-in-khao-yai', '456 Moo 15, Thanarat Road, Mu Si, Pak Chong, Nakhon Ratchasima 30450', 14.570450::double precision, 101.402233::double precision),
    -- Government coordinates only: missing fields deliberately remain null.
    ('restaurant', 'Kua Kampan Khao Yai', 'kua-kampan-khao-yai', null::text, 14.517025::double precision, 101.431519::double precision),
    ('restaurant', 'Klua Jan Pha', 'klua-jan-pha', null::text, 14.535050::double precision, 101.387721::double precision),
    ('restaurant', 'KHRUA BINLA', 'khrua-binla', null::text, 14.534521::double precision, 101.386831::double precision),
    ('cafe', 'Coffee Terrace', 'coffee-terrace-pak-chong', null::text, 14.697165::double precision, 101.407046::double precision),
    ('restaurant', 'Lookkai Cafe Restaurant Khao Yai', 'lookkai-cafe-restaurant-khao-yai', null::text, 14.649007::double precision, 101.408054::double precision),
    -- Direct operator sources; coordinates are not inferred from an address or map result.
    ('attraction', 'GranMonte Vineyard & Winery', 'granmonte-vineyard-winery', '52 Moo 9, Phaya Yen, Pak Chong, Nakhon Ratchasima 30320', null::double precision, null::double precision),
    ('restaurant', 'Papillon', 'papillon-u-khao-yai', '99/22 Moo 1, Mu Si, Pak Chong, Nakhon Ratchasima 30130', null::double precision, null::double precision),
    ('cafe', 'Khao Yai Art Tree Café', 'khao-yai-art-tree-cafe', '168/1 Moo 8, Pong Talong, Pak Chong, Nakhon Ratchasima 30450', null::double precision, null::double precision),
    ('restaurant', 'Khao Yai Art Tree Restaurant', 'khao-yai-art-tree-restaurant', '168/1 Moo 8, Pong Talong, Pak Chong, Nakhon Ratchasima 30450', null::double precision, null::double precision),
    ('attraction', 'Khao Yai National Park', 'khao-yai-national-park', 'P.O. Box 9, Mu Si, Pak Chong, Nakhon Ratchasima 30130', null::double precision, null::double precision),
    -- TAT article is an older institutional source: held as pending source intake only.
    ('cafe', 'BU•CO•LIC x Khaoyai Café', 'bucolic-x-khaoyai-cafe', '11 Moo 18, Mu Si, Pak Chong, Nakhon Ratchasima', null::double precision, null::double precision),
    ('cafe', 'Rabbit Café at Hotel Labaris', 'rabbit-cafe-hotel-labaris', '9 Moo 9, Mu Si, Pak Chong, Nakhon Ratchasima', null::double precision, null::double precision),
    ('cafe', 'Klang Pana Roses Garden & Café', 'klang-pana-roses-garden-cafe', '81 Moo 10, Ban Heaw Pla Kang Village, Mu Si, Pak Chong, Nakhon Ratchasima', null::double precision, null::double precision),
    ('cafe', 'Campfire Café Khao Yai', 'campfire-cafe-khao-yai', '444 Thanarat Road, Mu Si, Pak Chong, Nakhon Ratchasima', null::double precision, null::double precision)
) as c(place_type, name, slug, address, latitude, longitude)
where d.slug = 'pak-chong-khao-yai';

-- Only direct, current operator/government hours are entered.
-- No inferred or stale editorial hours are stored as planner inputs.
insert into public.place_hours (
  place_id,
  day_of_week,
  open_time,
  close_time,
  is_closed,
  crosses_midnight
)
select p.id, h.day_of_week, h.open_time, h.close_time, h.is_closed, false
from public.places p
join (
  values
    -- Papillon: official U Khao Yai page, daily 06:30–22:00.
    ('papillon-u-khao-yai', 0::smallint, '06:30:00'::time, '22:00:00'::time, false),
    ('papillon-u-khao-yai', 1::smallint, '06:30:00'::time, '22:00:00'::time, false),
    ('papillon-u-khao-yai', 2::smallint, '06:30:00'::time, '22:00:00'::time, false),
    ('papillon-u-khao-yai', 3::smallint, '06:30:00'::time, '22:00:00'::time, false),
    ('papillon-u-khao-yai', 4::smallint, '06:30:00'::time, '22:00:00'::time, false),
    ('papillon-u-khao-yai', 5::smallint, '06:30:00'::time, '22:00:00'::time, false),
    ('papillon-u-khao-yai', 6::smallint, '06:30:00'::time, '22:00:00'::time, false),
    -- Khao Yai Art Tree Café: official page, daily 07:00–19:00.
    ('khao-yai-art-tree-cafe', 0::smallint, '07:00:00'::time, '19:00:00'::time, false),
    ('khao-yai-art-tree-cafe', 1::smallint, '07:00:00'::time, '19:00:00'::time, false),
    ('khao-yai-art-tree-cafe', 2::smallint, '07:00:00'::time, '19:00:00'::time, false),
    ('khao-yai-art-tree-cafe', 3::smallint, '07:00:00'::time, '19:00:00'::time, false),
    ('khao-yai-art-tree-cafe', 4::smallint, '07:00:00'::time, '19:00:00'::time, false),
    ('khao-yai-art-tree-cafe', 5::smallint, '07:00:00'::time, '19:00:00'::time, false),
    ('khao-yai-art-tree-cafe', 6::smallint, '07:00:00'::time, '19:00:00'::time, false),
    -- Khao Yai National Park: official park page, daily 06:00–18:00.
    ('khao-yai-national-park', 0::smallint, '06:00:00'::time, '18:00:00'::time, false),
    ('khao-yai-national-park', 1::smallint, '06:00:00'::time, '18:00:00'::time, false),
    ('khao-yai-national-park', 2::smallint, '06:00:00'::time, '18:00:00'::time, false),
    ('khao-yai-national-park', 3::smallint, '06:00:00'::time, '18:00:00'::time, false),
    ('khao-yai-national-park', 4::smallint, '06:00:00'::time, '18:00:00'::time, false),
    ('khao-yai-national-park', 5::smallint, '06:00:00'::time, '18:00:00'::time, false),
    ('khao-yai-national-park', 6::smallint, '06:00:00'::time, '18:00:00'::time, false)
) as h(slug, day_of_week, open_time, close_time, is_closed) on p.slug = h.slug;

insert into public.place_sources (
  place_id, source_type, source_url, source_note, checked_at, checked_by
)
select p.id, s.source_type, s.source_url, s.source_note, '2026-09-19T14:00:00Z'::timestamptz, null
from public.places p
join (
  values
    ('steak-in-khao-yai', 'government', 'https://foodsan.anamai.moph.go.th/th/food-sanitation/download/?did=204386&id=72019&reload=', 'Department of Health record: matching venue and coordinates 14.570450, 101.402233.'),
    ('steak-in-khao-yai', 'official_social', 'https://www.facebook.com/steakin.khaoyai/', 'Official Facebook identity/address source. Operating hours were not inserted because accessible official snippets conflict.'),
    ('kua-kampan-khao-yai', 'government', 'https://foodsan.anamai.moph.go.th/th/food-sanitation/download/?did=204386&id=72019&reload=', 'Department of Health record: matching venue and coordinates 14.517025, 101.431519. Current operating facts remain incomplete.'),
    ('klua-jan-pha', 'government', 'https://foodsan.anamai.moph.go.th/th/food-sanitation/download/?did=204386&id=72019&reload=', 'Department of Health record: matching venue and coordinates 14.535050, 101.387721. Current operating facts remain incomplete.'),
    ('khrua-binla', 'government', 'https://foodsan.anamai.moph.go.th/th/food-sanitation/download/?did=204386&id=72019&reload=', 'Department of Health record: matching venue and coordinates 14.534521, 101.386831. Current operating facts remain incomplete.'),
    ('coffee-terrace-pak-chong', 'government', 'https://foodsan.anamai.moph.go.th/th/food-sanitation/download/?did=204386&id=72019&reload=', 'Department of Health record: matching venue and coordinates 14.697165, 101.407046. Current operating facts remain incomplete.'),
    ('lookkai-cafe-restaurant-khao-yai', 'government', 'https://foodsan.anamai.moph.go.th/th/food-sanitation/download/?did=204386&id=72019&reload=', 'Department of Health record: matching venue and coordinates 14.649007, 101.408054. Current operating facts remain incomplete.'),
    ('granmonte-vineyard-winery', 'official_website', 'https://www.granmonte.com/tour.php', 'Official operator source: 52 Moo 9, Phaya Yen, Pak Chong; tour information. Numeric coordinates require a direct-source confirmation.'),
    ('papillon-u-khao-yai', 'official_website', 'https://www.uhotelsresorts.com/ukhaoyai/dining/papillon', 'Official operator source: address and daily 06:30–22:00 hours. Numeric coordinates require a direct-source confirmation.'),
    ('khao-yai-art-tree-cafe', 'official_website', 'https://khaoyaiarttree.com/en/food-and-drink/', 'Official operator source: address and daily 07:00–19:00 hours. Numeric coordinates require a direct-source confirmation.'),
    ('khao-yai-art-tree-restaurant', 'official_website', 'https://khaoyaiarttree.com/en/food-and-drink/', 'Official operator source: address and split meal periods. No place_hours inserted because the existing editor expects one interval per day; model this after Admin review.'),
    ('khao-yai-national-park', 'official_website', 'https://www.khaoyainationalpark.com/en/plan-your-visit', 'Official park source: address and daily 06:00–18:00 hours. A specific visitor-entry coordinate is still required.'),
    ('bucolic-x-khaoyai-cafe', 'government_tourism', 'https://www.tourismthailand.org/Articles/khao-yai-the-hub-of-restaurants-and-attractions', 'TAT editorial source published in 2020: address and historical operating details. Refresh from operator before using any hours or planner facts.'),
    ('rabbit-cafe-hotel-labaris', 'government_tourism', 'https://www.tourismthailand.org/Articles/khao-yai-the-hub-of-restaurants-and-attractions', 'TAT editorial source published in 2020: address and historical operating details. Refresh from operator before using any hours or planner facts.'),
    ('klang-pana-roses-garden-cafe', 'government_tourism', 'https://www.tourismthailand.org/Articles/khao-yai-the-hub-of-restaurants-and-attractions', 'TAT editorial source published in 2020: address and historical operating details. Refresh from operator before using any hours or planner facts.'),
    ('campfire-cafe-khao-yai', 'government_tourism', 'https://www.tourismthailand.org/Articles/khao-yai-the-hub-of-restaurants-and-attractions', 'TAT editorial source published in 2020: address and historical operating details. Refresh from operator before using any hours or planner facts.')
) as s(slug, source_type, source_url, source_note) on p.slug = s.slug;

commit;

-- Post-run verification (read-only):
-- select
--   p.slug, p.name, p.place_type, p.publication_status, p.verification_status,
--   p.latitude, p.longitude, count(distinct h.id) as hour_rows,
--   count(distinct s.id) as source_rows
-- from public.places p
-- left join public.place_hours h on h.place_id = p.id
-- left join public.place_sources s on s.place_id = p.id
-- where p.slug in (
--   'steak-in-khao-yai', 'kua-kampan-khao-yai', 'klua-jan-pha', 'khrua-binla',
--   'coffee-terrace-pak-chong', 'lookkai-cafe-restaurant-khao-yai',
--   'granmonte-vineyard-winery', 'papillon-u-khao-yai', 'khao-yai-art-tree-cafe',
--   'khao-yai-art-tree-restaurant', 'khao-yai-national-park',
--   'bucolic-x-khaoyai-cafe', 'rabbit-cafe-hotel-labaris',
--   'klang-pana-roses-garden-cafe', 'campfire-cafe-khao-yai'
-- )
-- group by p.id
-- order by p.name;
