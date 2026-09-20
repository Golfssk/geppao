-- Phase 18 / Batch 002 collision preflight
-- Read-only. This identifies exactly which candidate collides with which existing Place.
-- It makes no changes.

with candidates as (
  select * from (
    values
      ('Steak In Khao Yai', 'steak-in-khao-yai'),
      ('Kua Kampan Khao Yai', 'kua-kampan-khao-yai'),
      ('Klua Jan Pha', 'klua-jan-pha'),
      ('KHRUA BINLA', 'khrua-binla'),
      ('Coffee Terrace', 'coffee-terrace-pak-chong'),
      ('Lookkai Cafe Restaurant Khao Yai', 'lookkai-cafe-restaurant-khao-yai'),
      ('GranMonte Vineyard & Winery', 'granmonte-vineyard-winery'),
      ('Papillon', 'papillon-u-khao-yai'),
      ('Khao Yai Art Tree Café', 'khao-yai-art-tree-cafe'),
      ('Khao Yai Art Tree Restaurant', 'khao-yai-art-tree-restaurant'),
      ('Khao Yai National Park', 'khao-yai-national-park'),
      ('BU•CO•LIC x Khaoyai Café', 'bucolic-x-khaoyai-cafe'),
      ('Rabbit Café at Hotel Labaris', 'rabbit-cafe-hotel-labaris'),
      ('Klang Pana Roses Garden & Café', 'klang-pana-roses-garden-cafe'),
      ('Campfire Café Khao Yai', 'campfire-cafe-khao-yai')
  ) as x(candidate_name, candidate_slug)
)
select
  c.candidate_name,
  c.candidate_slug,
  p.id as existing_place_id,
  p.name as existing_name,
  p.slug as existing_slug,
  p.place_type as existing_type,
  p.publication_status as existing_publication_status,
  p.verification_status as existing_verification_status,
  case
    when p.slug = c.candidate_slug and lower(p.name) = lower(c.candidate_name) then 'same slug and same name'
    when p.slug = c.candidate_slug then 'slug collision'
    else 'name collision'
  end as collision_reason
from candidates c
join public.places p
  on p.slug = c.candidate_slug
  or lower(p.name) = lower(c.candidate_name)
order by c.candidate_name, p.created_at;

-- If this query returns zero rows, rerun the exact Batch 002 SQL from GitHub.
-- If it returns rows, do not rename or overwrite anything. Send the result back
-- so each collision can be resolved as an existing record, a duplicate, or a
-- genuinely distinct Place.
