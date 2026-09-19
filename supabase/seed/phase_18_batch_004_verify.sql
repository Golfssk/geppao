-- Phase 18 / Batch 004 verification (read-only)
-- Expected: two PASS rows, both pending/pending, no price rows.

with expected as (
  select * from (values
    ('khao-yai-kayak-nature-trips-atv','activity',0,2,'082-875-5165'),
    ('atv-khao-yai-km9','activity',7,2,'064-156-9547')
  ) as x(slug,expected_type,expected_hour_rows,expected_source_rows,expected_phone)
), actual as (
  select p.id,p.slug,p.name,p.place_type,p.publication_status,p.verification_status,p.phone,
    count(distinct h.id)::integer as hour_rows,count(distinct s.id)::integer as source_rows,count(distinct i.id)::integer as price_rows
  from public.places p
  left join public.place_hours h on h.place_id=p.id
  left join public.place_sources s on s.place_id=p.id
  left join public.price_items i on i.place_id=p.id
  where p.slug in (select slug from expected)
  group by p.id
)
select e.slug,
  case
    when a.id is null then 'FAIL: missing place'
    when a.place_type<>e.expected_type then 'FAIL: unexpected type'
    when a.publication_status<>'pending' or a.verification_status<>'pending' then 'FAIL: unexpected moderation status'
    when a.phone<>e.expected_phone then 'FAIL: unexpected phone'
    when a.hour_rows<>e.expected_hour_rows then 'FAIL: unexpected hour row count'
    when a.source_rows<>e.expected_source_rows then 'FAIL: unexpected source row count'
    when a.price_rows<>0 then 'FAIL: price must remain absent'
    else 'PASS'
  end as status,
  a.name,a.publication_status,a.verification_status,a.phone,
  coalesce(a.hour_rows,0) as hour_rows,coalesce(a.source_rows,0) as source_rows,coalesce(a.price_rows,0) as price_rows
from expected e left join actual a on a.slug=e.slug
order by e.slug;
