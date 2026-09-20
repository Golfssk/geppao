-- Phase 18: allow Admins to curate unclaimed pending Places without business ownership.
-- Depends on 005_admin_curation.sql and 013_phase_18_publication_quality_gate.sql.
-- Additive. Does not change Place publication or verification status.

begin;

-- Admins may edit curated Place fields through authenticated server routes.
drop policy if exists "Admins update places" on public.places;
create policy "Admins update places"
on public.places
for update
to authenticated
using (public.is_geppao_admin())
with check (public.is_geppao_admin());

-- Admins may maintain Place child records for the curation workflow.
drop policy if exists "Admins manage place images" on public.place_images;
create policy "Admins manage place images"
on public.place_images
for all
to authenticated
using (public.is_geppao_admin())
with check (public.is_geppao_admin());

drop policy if exists "Admins manage place hours" on public.place_hours;
create policy "Admins manage place hours"
on public.place_hours
for all
to authenticated
using (public.is_geppao_admin())
with check (public.is_geppao_admin());

drop policy if exists "Admins manage place prices" on public.price_items;
create policy "Admins manage place prices"
on public.price_items
for all
to authenticated
using (public.is_geppao_admin())
with check (public.is_geppao_admin());

-- Secure replacement helpers retain authorization at the database boundary.
create or replace function public.admin_replace_place_hours(
  target_place_id uuid,
  items jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_geppao_admin() then
    raise exception 'Admin access required';
  end if;

  if not exists (select 1 from public.places where id = target_place_id) then
    raise exception 'Place not found';
  end if;

  if jsonb_typeof(items) <> 'array' then
    raise exception 'Hours must be an array';
  end if;

  delete from public.place_hours where place_id = target_place_id;

  insert into public.place_hours(
    place_id, day_of_week, open_time, close_time, is_closed,
    crosses_midnight, valid_from, valid_until
  )
  select
    target_place_id,
    (x->>'dayOfWeek')::smallint,
    nullif(x->>'openTime', '')::time,
    nullif(x->>'closeTime', '')::time,
    coalesce((x->>'isClosed')::boolean, false),
    coalesce((x->>'crossesMidnight')::boolean, false),
    nullif(x->>'validFrom', '')::date,
    nullif(x->>'validUntil', '')::date
  from jsonb_array_elements(items) x;
end;
$$;

create or replace function public.admin_replace_place_prices(
  target_place_id uuid,
  items jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_geppao_admin() then
    raise exception 'Admin access required';
  end if;

  if not exists (select 1 from public.places where id = target_place_id) then
    raise exception 'Place not found';
  end if;

  if jsonb_typeof(items) <> 'array' then
    raise exception 'Prices must be an array';
  end if;

  delete from public.price_items where place_id = target_place_id;

  insert into public.price_items(
    place_id, label, amount_min, amount_max, currency, price_unit,
    is_estimate, audience, min_quantity, valid_from, valid_until
  )
  select
    target_place_id,
    x->>'label',
    coalesce((x->>'amountMin')::numeric, 0),
    nullif(x->>'amountMax', '')::numeric,
    coalesce(nullif(x->>'currency', ''), 'THB'),
    x->>'unit',
    coalesce((x->>'isEstimate')::boolean, false),
    nullif(x->>'audience', ''),
    nullif(x->>'minQuantity', '')::integer,
    nullif(x->>'validFrom', '')::timestamptz,
    nullif(x->>'validUntil', '')::timestamptz
  from jsonb_array_elements(items) x;
end;
$$;

revoke all on function public.admin_replace_place_hours(uuid, jsonb) from public;
grant execute on function public.admin_replace_place_hours(uuid, jsonb) to authenticated;
revoke all on function public.admin_replace_place_prices(uuid, jsonb) from public;
grant execute on function public.admin_replace_place_prices(uuid, jsonb) to authenticated;

-- Admin-uploaded curation images are isolated under admin/{place_id}/.
drop policy if exists "Admins upload curation place images" on storage.objects;
create policy "Admins upload curation place images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'place-images'
  and public.is_geppao_admin()
  and (storage.foldername(name))[1] = 'admin'
  and exists (
    select 1 from public.places p
    where p.id::text = (storage.foldername(name))[2]
  )
);

drop policy if exists "Admins update curation place images" on storage.objects;
create policy "Admins update curation place images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'place-images'
  and public.is_geppao_admin()
  and (storage.foldername(name))[1] = 'admin'
)
with check (
  bucket_id = 'place-images'
  and public.is_geppao_admin()
  and (storage.foldername(name))[1] = 'admin'
);

drop policy if exists "Admins delete curation place images" on storage.objects;
create policy "Admins delete curation place images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'place-images'
  and public.is_geppao_admin()
  and (storage.foldername(name))[1] = 'admin'
);

commit;

-- Verification after running:
-- select policyname, tablename
-- from pg_policies
-- where schemaname = 'public'
--   and policyname in ('Admins update places', 'Admins manage place images', 'Admins manage place hours', 'Admins manage place prices')
-- order by tablename, policyname;
--
-- select routine_name
-- from information_schema.routines
-- where routine_schema = 'public'
--   and routine_name in ('admin_replace_place_hours', 'admin_replace_place_prices')
-- order by routine_name;
--
-- select policyname
-- from pg_policies
-- where schemaname = 'storage'
--   and tablename = 'objects'
--   and policyname like 'Admins % curation place images'
-- order by policyname;
