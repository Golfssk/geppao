begin;
create or replace function public.search_public_catalog(
  p_query text default '', p_destination text default '', p_guests integer default null,
  p_pet boolean default false, p_parking boolean default false, p_accessible boolean default false,
  p_verified boolean default false, p_max_price numeric default null,
  p_sort text default 'name', p_page integer default 1, p_type text default 'all'
) returns jsonb language plpgsql stable security invoker set search_path=public,pg_temp as $$
declare result jsonb;
begin
  if p_type is null or p_type not in ('all','restaurant','cafe','accommodation','attraction','activity','event')
    or p_query is null or length(p_query)>100 or p_destination is null
    or (p_destination<>'' and p_destination!~'^[a-z0-9-]{1,80}$')
    or (p_guests is not null and (p_guests<1 or p_guests>30))
    or (p_max_price is not null and (p_max_price<0 or p_max_price>1000000 or p_max_price::text in ('NaN','Infinity','-Infinity')))
    or p_sort is null or p_sort not in ('name','price_asc','price_desc')
    or p_page is null or p_page<1 or p_page>500
    or (p_type<>'accommodation' and (p_guests is not null or p_max_price is not null or p_sort<>'name')) then
    raise exception 'Invalid unified search parameters' using errcode='22023';
  end if;
  with candidates as (
    select p.id,'place'::text as kind,p.place_type as type,p.slug,p.name,p.description,p.address,d.name as destination_name,
      p.verification_status,image.image_url,image.alt_text as image_alt,
      price.amount_min as price,price.price_unit,price.currency,price.is_estimate,null::timestamptz as starts_at,p.catalog_level,p.directory_facts
    from public.places p
    left join public.destinations d on d.id=p.destination_id and d.status='active'
    left join public.accommodation_details a on a.place_id=p.id
    left join lateral (
      select i.image_url,i.alt_text from public.place_images i
      where i.place_id=p.id and i.approved_for_public is true and i.takedown_status='active'
        and (i.rights_expires_at is null or i.rights_expires_at>=current_date)
      order by i.is_cover desc,i.sort_order,i.id limit 1
    ) image on true
    left join lateral (
      select pi.amount_min,pi.price_unit,pi.currency,pi.is_estimate from public.price_items pi
      where pi.place_id=p.id and pi.currency='THB'
        and ((p.place_type='accommodation' and pi.price_unit='night')
          or (p.place_type<>'accommodation' and pi.price_unit in ('person','group','activity','item','free')))
      -- A headline is only a reference with an explicit unit, never a live quote.
      order by pi.amount_min,pi.price_unit,pi.id limit 1
    ) price on true
    where p.publication_status='published'
      and (p_type='all' or p.place_type=p_type or (p_type<>'accommodation' and exists(
        select 1 from public.place_secondary_types t where t.place_id=p.id and t.place_type=p_type)))
      and (p_query='' or strpos(lower(concat_ws(' ',p.name,p.description,p.address,d.name,p.directory_facts->>'category',p.directory_facts->>'source_tab')),lower(trim(p_query)))>0)
      and (p_destination='' or d.slug=p_destination)
      and (p_guests is null or a.maximum_guests>=p_guests)
      and (not coalesce(p_pet,false) or p.pet_friendly is true)
      and (not coalesce(p_parking,false) or p.parking_available is true)
      and (not coalesce(p_accessible,false) or p.accessibility_supported is true)
      and (not coalesce(p_verified,false) or p.verification_status='verified')
      and (p_max_price is null or price.amount_min<=p_max_price)
    union all
    select e.id,'event'::text,'event'::text,e.slug,e.name,e.description,
      coalesce(nullif(e.temporary_venue_name,''),e.address),d.name,e.verification_status,
      image.image_url,image.alt_text,price.amount_min,price.price_unit,price.currency,price.is_estimate,schedule.starts_at,'curated'::text as catalog_level,null::jsonb as directory_facts
    from public.events e
    left join public.destinations d on d.id=e.destination_id and d.status='active'
    left join lateral (
      select i.image_url,i.alt_text from public.event_images i
      where i.event_id=e.id and i.approved_for_public is true and i.takedown_status='active'
        and (i.rights_expires_at is null or i.rights_expires_at>=current_date)
      order by i.is_cover desc,i.sort_order,i.id limit 1
    ) image on true
    left join lateral (
      select pi.amount_min,pi.price_unit,pi.currency,pi.is_estimate from public.price_items pi
      where pi.event_id=e.id and pi.currency='THB' and pi.price_unit in ('person','group','activity','item','free')
      order by pi.amount_min,pi.price_unit,pi.id limit 1
    ) price on true
    left join lateral (
      select s.starts_at from public.event_schedules s where s.event_id=e.id and s.status='scheduled' and s.ends_at>now()
      order by s.starts_at,s.id limit 1
    ) schedule on true
    where e.publication_status='published' and p_type in ('all','event')
      and (p_query='' or strpos(lower(concat_ws(' ',e.name,e.description,e.address,e.temporary_venue_name,d.name)),lower(trim(p_query)))>0)
      and (p_destination='' or d.slug=p_destination)
      -- Events have no recorded amenity booleans. Unknown is not a match.
      and not coalesce(p_pet,false) and not coalesce(p_parking,false) and not coalesce(p_accessible,false)
      and (not coalesce(p_verified,false) or e.verification_status='verified')
  ), ordered as (
    select *,row_number() over(order by
      case when p_sort='price_asc' then price end asc nulls last,
      case when p_sort='price_desc' then price end desc nulls last,
      name,kind,id) as result_order from candidates
  ), paged as (
    select * from ordered order by result_order limit 12 offset ((p_page-1)*12)
  )
  select jsonb_build_object('items',coalesce((select jsonb_agg(to_jsonb(paged)-'result_order' order by result_order) from paged),'[]'::jsonb),
    'total',(select count(*) from candidates)) into result;
  return result;
end $$;
revoke all on function public.search_public_catalog(text,text,integer,boolean,boolean,boolean,boolean,numeric,text,integer,text) from public;
grant execute on function public.search_public_catalog(text,text,integer,boolean,boolean,boolean,boolean,numeric,text,integer,text) to anon,authenticated;
commit;
