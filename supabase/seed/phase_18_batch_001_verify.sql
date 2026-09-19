-- Phase 18 / Batch 001 verification
-- Read-only. Run after phase_18_batch_001_pending_places.sql succeeds.
-- Expected result: every row is PASS.

with expected as (
  select * from (
    values
      ('ribs-mannn', 'Ribs Mannn', 'restaurant', 7, 2, 14.634528::double precision, 101.411187::double precision),
      ('pirom-cafe', 'Pirom Café', 'cafe', 7, 1, 14.564309::double precision, 101.250632::double precision),
      ('great-hornbill-winery-restaurant', 'Great Hornbill Winery Restaurant', 'restaurant', 7, 1, 14.5749702::double precision, 101.2346983::double precision),
      ('pb-valley-winery-tour', 'PB Valley Vineyard & Winery Tour', 'activity', 0, 1, 14.5749702::double precision, 101.2346983::double precision),
      ('scenical-world-khao-yai', 'Scenical World Khao Yai', 'attraction', 7, 1, 14.5374498::double precision, 101.3781167::double precision)
  ) as x(slug, expected_name, expected_type, expected_hour_rows, expected_source_rows, expected_latitude, expected_longitude)
),
actual as (
  select
    p.id,
    p.slug,
    p.name,
    p.place_type,
    p.publication_status,
    p.verification_status,
    p.latitude,
    p.longitude,
    count(distinct h.id)::integer as hour_rows,
    count(distinct s.id)::integer as source_rows,
    count(distinct i.id)::integer as price_rows
  from public.places p
  left join public.place_hours h on h.place_id = p.id
  left join public.place_sources s on s.place_id = p.id
  left join public.price_items i on i.place_id = p.id
  where p.slug in (select slug from expected)
  group by p.id
)
select
  e.slug,
  case
    when a.id is null then 'FAIL: missing place'
    when a.name <> e.expected_name then 'FAIL: unexpected name'
    when a.place_type <> e.expected_type then 'FAIL: unexpected type'
    when a.publication_status <> 'pending' then 'FAIL: publication is not pending'
    when a.verification_status <> 'pending' then 'FAIL: verification is not pending'
    when a.latitude is distinct from e.expected_latitude or a.longitude is distinct from e.expected_longitude then 'FAIL: unexpected coordinates'
    when a.hour_rows <> e.expected_hour_rows then 'FAIL: unexpected hour row count'
    when a.source_rows <> e.expected_source_rows then 'FAIL: unexpected source row count'
    when a.price_rows <> 0 then 'FAIL: price must remain absent'
    else 'PASS'
  end as status,
  a.name,
  a.place_type,
  a.publication_status,
  a.verification_status,
  a.latitude,
  a.longitude,
  coalesce(a.hour_rows, 0) as hour_rows,
  coalesce(a.source_rows, 0) as source_rows,
  coalesce(a.price_rows, 0) as price_rows
from expected e
left join actual a on a.slug = e.slug
order by e.slug;

-- Read-only moderation queue preview:
-- select
--   p.id,
--   p.name,
--   p.place_type,
--   p.publication_status,
--   p.verification_status,
--   p.latitude,
--   p.longitude
-- from public.places p
-- where p.slug in (
--   'ribs-mannn', 'pirom-cafe', 'great-hornbill-winery-restaurant',
--   'pb-valley-winery-tour', 'scenical-world-khao-yai'
-- )
-- order by p.name;
