begin;
-- Additive read model; no inventory, booking, payments or fictional availability.
create index if not exists places_public_stay_search_idx
  on public.places(destination_id, name, id)
  where publication_status = 'published' and place_type = 'accommodation';
create index if not exists price_items_nightly_stay_idx
  on public.price_items(place_id, amount_min, id)
  where currency = 'THB' and price_unit = 'night';
create or replace function public.search_public_stays(
  p_query text default '', p_destination text default '', p_guests integer default null,
  p_pet boolean default false, p_parking boolean default false, p_accessible boolean default false,
  p_verified boolean default false, p_max_price numeric default null,
  p_sort text default 'name', p_page integer default 1
) returns jsonb language plpgsql stable security invoker set search_path = public, pg_temp as $$
declare result jsonb;
begin
  if p_query is null or length(p_query) > 100 or p_destination is null
     or (p_destination <> '' and p_destination !~ '^[a-z0-9-]{1,80}$')
     or (p_guests is not null and (p_guests < 1 or p_guests > 30))
     or (p_max_price is not null and (p_max_price < 0 or p_max_price > 1000000 or p_max_price::text in ('NaN','Infinity','-Infinity')))
     or p_sort is null or p_sort not in ('name','price_asc','price_desc')
     or p_page is null or p_page < 1 or p_page > 500 then
    raise exception 'Invalid stay search parameters' using errcode = '22023';
  end if;
  with candidates as (
    select p.id, p.slug, p.name, p.description, p.address, d.name as destination_name,
      p.verification_status, p.last_verified_at, p.pet_friendly, p.parking_available, p.accessibility_supported,
      a.maximum_guests, a.check_in_time, a.check_out_time,
      image.image_url, image.alt_text as image_alt,
      price.amount_min as price, price.amount_max as price_max, price.is_estimate
    from public.places p
    left join public.destinations d on d.id = p.destination_id and d.status = 'active'
    left join public.accommodation_details a on a.place_id = p.id
    left join lateral (
      select i.image_url, i.alt_text from public.place_images i where i.place_id = p.id and i.approved_for_public is true and i.takedown_status = 'active'
      order by i.is_cover desc, i.sort_order, i.id limit 1
    ) image on true
    left join lateral (
      select pi.amount_min, pi.amount_max, pi.is_estimate from public.price_items pi
      where pi.place_id = p.id and pi.currency = 'THB' and pi.price_unit = 'night'
      order by pi.amount_min, pi.id limit 1
    ) price on true
    where p.publication_status = 'published' and p.place_type = 'accommodation'
      -- Literal substring search: no dynamic SQL, wildcard or PostgREST grammar injection.
      and (p_query = '' or strpos(lower(concat_ws(' ',p.name,p.address,d.name)),lower(trim(p_query))) > 0)
      and (p_destination = '' or d.slug = p_destination)
      and (p_guests is null or a.maximum_guests >= p_guests)
      and (not coalesce(p_pet,false) or p.pet_friendly is true)
      and (not coalesce(p_parking,false) or p.parking_available is true)
      and (not coalesce(p_accessible,false) or p.accessibility_supported is true)
      and (not coalesce(p_verified,false) or p.verification_status = 'verified')
      and (p_max_price is null or price.amount_min <= p_max_price)
  ), ordered as (
    select *, row_number() over(order by
      case when p_sort = 'price_asc' then price end asc nulls last,
      case when p_sort = 'price_desc' then price end desc nulls last,
      name, id) as result_order from candidates
  ), paged as (
    select * from ordered order by result_order limit 12 offset ((p_page - 1) * 12)
  )
  select jsonb_build_object('items',coalesce((select jsonb_agg(to_jsonb(paged) - 'result_order' order by result_order) from paged),'[]'::jsonb),
    'total',(select count(*) from candidates)) into result;
  return result;
end $$;
revoke all on function public.search_public_stays(text,text,integer,boolean,boolean,boolean,boolean,numeric,text,integer) from public;
grant execute on function public.search_public_stays(text,text,integer,boolean,boolean,boolean,boolean,numeric,text,integer) to anon, authenticated;
comment on function public.search_public_stays(text,text,integer,boolean,boolean,boolean,boolean,numeric,text,integer)
  is 'RLS-preserving public lodging search. THB/night reference prices only; not date availability or a booking quote.';
commit;
