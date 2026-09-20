-- Phase 18 / Batch 002 verification
-- Read-only. Run after phase_18_batch_002_source_intake.sql succeeds.
-- Expected result: 15 rows, all status = PASS.

with expected as (
  select * from (
    values
      ('steak-in-khao-yai', 'restaurant', 14.570450::double precision, 101.402233::double precision, 0, 2),
      ('kua-kampan-khao-yai', 'restaurant', 14.517025::double precision, 101.431519::double precision, 0, 1),
      ('klua-jan-pha', 'restaurant', 14.535050::double precision, 101.387721::double precision, 0, 1),
      ('khrua-binla', 'restaurant', 14.534521::double precision, 101.386831::double precision, 0, 1),
      ('coffee-terrace-pak-chong', 'cafe', 14.697165::double precision, 101.407046::double precision, 0, 1),
      ('lookkai-cafe-restaurant-khao-yai', 'restaurant', 14.649007::double precision, 101.408054::double precision, 0, 1),
      ('granmonte-vineyard-winery', 'attraction', null::double precision, null::double precision, 0, 1),
      ('papillon-u-khao-yai', 'restaurant', null::double precision, null::double precision, 7, 1),
      ('khao-yai-art-tree-cafe', 'cafe', null::double precision, null::double precision, 7, 1),
      ('khao-yai-art-tree-restaurant', 'restaurant', null::double precision, null::double precision, 0, 1),
      ('khao-yai-national-park', 'attraction', null::double precision, null::double precision, 7, 1),
      ('bucolic-x-khaoyai-cafe', 'cafe', null::double precision, null::double precision, 0, 1),
      ('rabbit-cafe-hotel-labaris', 'cafe', null::double precision, null::double precision, 0, 1),
      ('klang-pana-roses-garden-cafe', 'cafe', null::double precision, null::double precision, 0, 1),
      ('campfire-cafe-khao-yai', 'cafe', null::double precision, null::double precision, 0, 1)
  ) as x(slug, expected_type, expected_latitude, expected_longitude, expected_hour_rows, expected_source_rows)
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
