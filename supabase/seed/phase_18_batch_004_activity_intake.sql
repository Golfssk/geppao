-- Phase 18 / Batch 004
-- Source-backed activity intake only. This creates pending records and does not publish.
-- See docs/PHASE_18_BATCH_004_ACTIVITY_INTAKE.md.

begin;

do $$
begin
  if not exists (select 1 from public.destinations where slug = 'pak-chong-khao-yai') then
    raise exception 'Batch 004 stopped: destination pak-chong-khao-yai does not exist.';
  end if;
  if exists (
    select 1 from public.places
    where slug in ('khao-yai-kayak-nature-trips-atv','atv-khao-yai-km9')
       or lower(name) in ('khao yai kayak nature trips & atv','atv เขาใหญ่ กม.9')
  ) then
    raise exception 'Batch 004 stopped: an activity candidate already exists. Run the Batch 004 preflight before changing any record.';
  end if;
end $$;

insert into public.places (
  business_id,destination_id,place_type,name,slug,address,google_maps_url,phone,
  publication_status,verification_status
)
select null,d.id,c.place_type,c.name,c.slug,c.address,c.google_maps_url,c.phone,'pending','pending'
from public.destinations d
cross join (
  values
    (
      'activity',
      'Khao Yai Kayak Nature Trips & ATV',
      'khao-yai-kayak-nature-trips-atv',
      'Durian garden behind Wat Ko Kaew, Mu Si, Pak Chong, Nakhon Ratchasima',
      'https://maps.app.goo.gl/UDh5qVu595iDXFPQ8',
      '082-875-5165'
    ),
    (
      'activity',
      'ATV เขาใหญ่ กม.9',
      'atv-khao-yai-km9',
      '75 Nong Nam Daeng, Pak Chong District, Nakhon Ratchasima 30130',
      'https://maps.app.goo.gl/G56aEZnWn7piKbYd7',
      '064-156-9547'
    )
) as c(place_type,name,slug,address,google_maps_url,phone)
where d.slug='pak-chong-khao-yai';

-- ATV operator states daily 09:00–20:00. Kayak hours remain unverified.
insert into public.place_hours(place_id,day_of_week,open_time,close_time,is_closed,crosses_midnight)
select p.id,h.day_of_week,'09:00:00'::time,'20:00:00'::time,false,false
from public.places p
cross join (values(0::smallint),(1::smallint),(2::smallint),(3::smallint),(4::smallint),(5::smallint),(6::smallint)) h(day_of_week)
where p.slug='atv-khao-yai-km9';

insert into public.place_sources(place_id,source_type,source_url,source_note,checked_at,checked_by)
select p.id,s.source_type,s.source_url,s.source_note,'2026-09-19T16:15:00Z'::timestamptz,null
from public.places p
join (
  values
    (
      'khao-yai-kayak-nature-trips-atv',
      'official_social',
      'https://www.facebook.com/61561109462487/posts/%E0%B8%A1%E0%B8%B2%E0%B9%80%E0%B8%A5%E0%B9%88%E0%B8%99%E0%B8%99%E0%B9%89%E0%B8%B3%E0%B8%81%E0%B8%B1%E0%B8%99%E0%B8%97%E0%B8%B5%E0%B9%88-%E0%B9%80%E0%B8%82%E0%B8%B2%E0%B9%83%E0%B8%AB%E0%B8%8D%E0%B9%88-kayak-nature-trips/122208281030370315/',
      'Operator states daily service and provides the map reference. Exact hours, launch conditions, duration, and safety rules require further verification.'
    ),
    (
      'khao-yai-kayak-nature-trips-atv',
      'official_social',
      'http://facebook.com/61561109462487/posts/122198274566370315',
      'Operator post identifies the Mu Si location, kayaking/ATV offering, life jackets and staff, pets, booking contact, and a stated package. No price item is imported because current validity requires confirmation.'
    ),
    (
      'atv-khao-yai-km9',
      'official_social',
      'https://www.facebook.com/61578851115378/?locale=mk_MK',
      'Operator page states daily 09:00–20:00 service, booking contact, and a map reference.'
    ),
    (
      'atv-khao-yai-km9',
      'google_maps',
      'http://maps.app.goo.gl/PFyKMbLJc8VtAENq8',
      'Direct map result identifies the activity as ATV rental service at 75 Nong Nam Daeng, Pak Chong. Price, duration, minimum age, and safety rules are not imported.'
    )
) as s(slug,source_type,source_url,source_note) on p.slug=s.slug;

commit;

-- Read-only verification:
-- select p.name,p.place_type,p.publication_status,p.verification_status,p.address,p.phone,
--        count(distinct h.id) as hour_rows,count(distinct s.id) as source_rows,count(distinct i.id) as price_rows
-- from public.places p
-- left join public.place_hours h on h.place_id=p.id
-- left join public.place_sources s on s.place_id=p.id
-- left join public.price_items i on i.place_id=p.id
-- where p.slug in ('khao-yai-kayak-nature-trips-atv','atv-khao-yai-km9')
-- group by p.id order by p.name;
