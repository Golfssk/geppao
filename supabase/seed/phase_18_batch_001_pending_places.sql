-- Phase 18 / Batch 001
-- Source-audited curation intake only.
-- This script creates five unclaimed, PENDING Places; it does not publish Local Data.
-- Run manually in Supabase SQL Editor only after reviewing the preflight result.
-- Checked sources: 2026-09-19T13:35:00Z
--
-- Excluded on purpose:
--   * Images: no usage/ownership decision has been made.
--   * Descriptions: no curator-approved copy has been provided.
--   * Prices: no current price is imported. PB tour rates on its page explicitly
--     expired on 2025-10-31.
--   * Unsupported duration, accessibility, pet, and booking claims.
--
-- Safety properties:
--   * No UPDATE, DELETE, ALTER, CREATE, or publication transition.
--   * Fails atomically if destination or a candidate name/slug already exists.
--   * Uses only direct-source facts recorded in PHASE_18_BATCH_001_CURATION_BACKLOG.md.

begin;

do $$
begin
  if not exists (
    select 1
    from public.destinations
    where slug = 'pak-chong-khao-yai'
  ) then
    raise exception 'Batch 001 stopped: destination pak-chong-khao-yai does not exist.';
  end if;

  if exists (
    select 1
    from public.places
    where slug in (
      'ribs-mannn',
      'pirom-cafe',
      'great-hornbill-winery-restaurant',
      'pb-valley-winery-tour',
      'scenical-world-khao-yai'
    )
    or lower(name) in (
      'ribs mannn',
      'pirom café',
      'great hornbill winery restaurant',
      'pb valley vineyard & winery tour',
      'scenical world khao yai'
    )
  ) then
    raise exception 'Batch 001 stopped: one or more candidate places already exist. Resolve duplicates before importing.';
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
  google_maps_url,
  recommended_duration_minutes,
  reservation_required,
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
  c.google_maps_url,
  c.recommended_duration_minutes,
  false,
  'pending',
  'pending'
from public.destinations d
cross join (
  values
    (
      'restaurant',
      'Ribs Mannn',
      'ribs-mannn',
      'Thanarat km.4, Nong Nam Daeng, Pak Chong District, Nakhon Ratchasima 30130',
      14.634528::double precision,
      101.411187::double precision,
      null::text,
      null::integer
    ),
    (
      'cafe',
      'Pirom Café',
      'pirom-cafe',
      'Moo 5, Phaya Yen, Pak Chong, Nakhon Ratchasima',
      14.564309::double precision,
      101.250632::double precision,
      'https://www.google.com/maps/dir/Current+Location/14.564309,101.250632',
      null::integer
    ),
    (
      'restaurant',
      'Great Hornbill Winery Restaurant',
      'great-hornbill-winery-restaurant',
      '102 Moo 5, Phaya Yen, Pak Chong, Nakhon Ratchasima 30320',
      14.5749702::double precision,
      101.2346983::double precision,
      'https://www.google.com/maps/dir/Current+Location/14.5749702,101.2346983',
      null::integer
    ),
    (
      'activity',
      'PB Valley Vineyard & Winery Tour',
      'pb-valley-winery-tour',
      '102 Moo 5, Phaya Yen, Pak Chong, Nakhon Ratchasima 30320',
      14.5749702::double precision,
      101.2346983::double precision,
      'https://www.google.com/maps/dir/Current+Location/14.5749702,101.2346983',
      70::integer
    ),
    (
      'attraction',
      'Scenical World Khao Yai',
      'scenical-world-khao-yai',
      '777 Moo 5, Thanarat Road, Mu Si, Pak Chong, Nakhon Ratchasima 30450',
      14.5374498::double precision,
      101.3781167::double precision,
      null::text,
      null::integer
    )
) as c(
  place_type,
  name,
  slug,
  address,
  latitude,
  longitude,
  google_maps_url,
  recommended_duration_minutes
)
where d.slug = 'pak-chong-khao-yai';

-- day_of_week follows the existing editor contract: 0=Sunday ... 6=Saturday.
insert into public.place_hours (
  place_id,
  day_of_week,
  open_time,
  close_time,
  is_closed,
  crosses_midnight
)
select
  p.id,
  h.day_of_week,
  h.open_time,
  h.close_time,
  h.is_closed,
  false
from public.places p
join (
  values
    -- Ribs Mannn: official site, open every day 10:30–22:30.
    ('ribs-mannn', 0::smallint, '10:30:00'::time, '22:30:00'::time, false),
    ('ribs-mannn', 1::smallint, '10:30:00'::time, '22:30:00'::time, false),
    ('ribs-mannn', 2::smallint, '10:30:00'::time, '22:30:00'::time, false),
    ('ribs-mannn', 3::smallint, '10:30:00'::time, '22:30:00'::time, false),
    ('ribs-mannn', 4::smallint, '10:30:00'::time, '22:30:00'::time, false),
    ('ribs-mannn', 5::smallint, '10:30:00'::time, '22:30:00'::time, false),
    ('ribs-mannn', 6::smallint, '10:30:00'::time, '22:30:00'::time, false),
    -- Pirom Café: official site, open every day 08:00–17:00.
    ('pirom-cafe', 0::smallint, '08:00:00'::time, '17:00:00'::time, false),
    ('pirom-cafe', 1::smallint, '08:00:00'::time, '17:00:00'::time, false),
    ('pirom-cafe', 2::smallint, '08:00:00'::time, '17:00:00'::time, false),
    ('pirom-cafe', 3::smallint, '08:00:00'::time, '17:00:00'::time, false),
    ('pirom-cafe', 4::smallint, '08:00:00'::time, '17:00:00'::time, false),
    ('pirom-cafe', 5::smallint, '08:00:00'::time, '17:00:00'::time, false),
    ('pirom-cafe', 6::smallint, '08:00:00'::time, '17:00:00'::time, false),
    -- Great Hornbill Winery Restaurant: official site, open daily 11:00–20:00.
    ('great-hornbill-winery-restaurant', 0::smallint, '11:00:00'::time, '20:00:00'::time, false),
    ('great-hornbill-winery-restaurant', 1::smallint, '11:00:00'::time, '20:00:00'::time, false),
    ('great-hornbill-winery-restaurant', 2::smallint, '11:00:00'::time, '20:00:00'::time, false),
    ('great-hornbill-winery-restaurant', 3::smallint, '11:00:00'::time, '20:00:00'::time, false),
    ('great-hornbill-winery-restaurant', 4::smallint, '11:00:00'::time, '20:00:00'::time, false),
    ('great-hornbill-winery-restaurant', 5::smallint, '11:00:00'::time, '20:00:00'::time, false),
    ('great-hornbill-winery-restaurant', 6::smallint, '11:00:00'::time, '20:00:00'::time, false),
    -- Scenical World: official site, open 10:00–18:00 and closed Wednesday.
    ('scenical-world-khao-yai', 0::smallint, '10:00:00'::time, '18:00:00'::time, false),
    ('scenical-world-khao-yai', 1::smallint, '10:00:00'::time, '18:00:00'::time, false),
    ('scenical-world-khao-yai', 2::smallint, '10:00:00'::time, '18:00:00'::time, false),
    ('scenical-world-khao-yai', 3::smallint, null::time, null::time, true),
    ('scenical-world-khao-yai', 4::smallint, '10:00:00'::time, '18:00:00'::time, false),
    ('scenical-world-khao-yai', 5::smallint, '10:00:00'::time, '18:00:00'::time, false),
    ('scenical-world-khao-yai', 6::smallint, '10:00:00'::time, '18:00:00'::time, false)
) as h(slug, day_of_week, open_time, close_time, is_closed)
  on p.slug = h.slug;

insert into public.place_sources (
  place_id,
  source_type,
  source_url,
  source_note,
  checked_at,
  checked_by
)
select
  p.id,
  s.source_type,
  s.source_url,
  s.source_note,
  '2026-09-19T13:35:00Z'::timestamptz,
  null
from public.places p
join (
  values
    (
      'ribs-mannn',
      'official_website',
      'https://www.ribs-mannn.com/',
      'Official operator source: name, address, and daily 10:30–22:30 operating hours.'
    ),
    (
      'ribs-mannn',
      'government',
      'https://foodsan.anamai.moph.go.th/th/food-sanitation/download/?did=204386&id=72019&reload=',
      'Department of Health source: matching venue record and coordinates 14.634528, 101.411187.'
    ),
    (
      'pirom-cafe',
      'official_website',
      'https://www.piromcafe.com/',
      'Official operator source: daily 08:00–17:00, Phaya Yen/Pak Chong location, and map coordinates 14.564309, 101.250632.'
    ),
    (
      'great-hornbill-winery-restaurant',
      'official_website',
      'https://www.pbvalley.com/restaurant/',
      'Official operator source: daily 11:00–20:00, address, and map coordinates 14.5749702, 101.2346983.'
    ),
    (
      'pb-valley-winery-tour',
      'official_website',
      'https://www.pbvalley.com/wine-tour/',
      'Official operator source: daily tour times 09:15, 11:15, 13:15, and 15:15; stated duration about 70 minutes; address and map coordinates 14.5749702, 101.2346983. Price deliberately omitted because the displayed rate expired 2025-10-31.'
    ),
    (
      'scenical-world-khao-yai',
      'official_website',
      'https://scenicalworld.com/',
      'Official operator source: address, daily 10:00–18:00 hours with Wednesday closure, and embedded map coordinates 14.5374498, 101.3781167.'
    )
) as s(slug, source_type, source_url, source_note)
  on p.slug = s.slug;

commit;

-- Post-run verification (read-only):
-- select
--   p.name,
--   p.place_type,
--   p.publication_status,
--   p.verification_status,
--   p.latitude,
--   p.longitude,
--   count(distinct h.id) as hour_rows,
--   count(distinct s.id) as source_rows
-- from public.places p
-- left join public.place_hours h on h.place_id = p.id
-- left join public.place_sources s on s.place_id = p.id
-- where p.slug in (
--   'ribs-mannn', 'pirom-cafe', 'great-hornbill-winery-restaurant',
--   'pb-valley-winery-tour', 'scenical-world-khao-yai'
-- )
-- group by p.id
-- order by p.name;
