-- Phase 18: explicit price decision and database-enforced Place publication gate.
-- Additive migration. Does not publish, modify, or delete any existing Place.

begin;

alter table public.places
  add column if not exists price_data_status text not null default 'unknown',
  add column if not exists price_data_note text;

alter table public.places
  drop constraint if exists places_price_data_status_check;

alter table public.places
  add constraint places_price_data_status_check
  check (price_data_status in ('unknown', 'available', 'free', 'missing', 'not_applicable'));

comment on column public.places.price_data_status is
  'Curator decision: unknown, available, free, missing, or not_applicable. Published Places require a non-unknown decision; available also requires a structured price_items row.';

comment on column public.places.price_data_note is
  'Optional curation context for a free, missing, or not-applicable price decision. Never invent a price value.';

create or replace function public.moderate_place(
  target_place_id uuid,
  decision text,
  note text default null
)
returns public.places
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.places;
  missing_fields text[];
begin
  if not is_geppao_admin() then
    raise exception 'Admin access required';
  end if;

  if decision = 'approve' then
    select array_remove(array[
      case when nullif(btrim(p.description), '') is null then 'description' end,
      case when nullif(btrim(p.address), '') is null then 'address' end,
      case when p.latitude is null or p.longitude is null then 'coordinates' end,
      case when p.recommended_duration_minutes is null then 'recommended duration' end,
      case when not exists (
        select 1 from public.place_images image
        where image.place_id = p.id and image.is_cover
      ) then 'cover image' end,
      case when not exists (
        select 1 from public.place_hours hours
        where hours.place_id = p.id
      ) then 'opening hours' end,
      case when not exists (
        select 1 from public.place_sources source
        where source.place_id = p.id
      ) then 'source' end,
      case
        when p.price_data_status in ('free', 'missing', 'not_applicable') then null
        when p.price_data_status = 'available' and exists (
          select 1 from public.price_items price
          where price.place_id = p.id
        ) then null
        else 'price decision'
      end
    ], null)
    into missing_fields
    from public.places p
    where p.id = target_place_id;

    if missing_fields is null then
      raise exception 'Place not found';
    end if;

    if cardinality(missing_fields) > 0 then
      raise exception 'Cannot publish Place: missing %', array_to_string(missing_fields, ', ');
    end if;

    update public.places
    set publication_status = 'published',
        verification_status = 'verified',
        last_verified_at = now(),
        moderation_note = note,
        moderated_by = auth.uid(),
        moderated_at = now(),
        updated_at = now()
    where id = target_place_id
    returning * into result;
  elsif decision = 'reject' then
    if nullif(btrim(note), '') is null then
      raise exception 'A rejection note is required';
    end if;

    update public.places
    set publication_status = 'rejected',
        verification_status = 'rejected',
        moderation_note = note,
        moderated_by = auth.uid(),
        moderated_at = now(),
        updated_at = now()
    where id = target_place_id
    returning * into result;
  elsif decision = 'archive' then
    update public.places
    set publication_status = 'archived',
        moderation_note = note,
        moderated_by = auth.uid(),
        moderated_at = now(),
        updated_at = now()
    where id = target_place_id
    returning * into result;
  elsif decision = 'return_to_draft' then
    update public.places
    set publication_status = 'draft',
        verification_status = 'unverified',
        moderation_note = note,
        moderated_by = auth.uid(),
        moderated_at = now(),
        updated_at = now()
    where id = target_place_id
    returning * into result;
  else
    raise exception 'Invalid moderation decision';
  end if;

  if result.id is null then
    raise exception 'Place not found';
  end if;

  insert into public.place_moderation_log(place_id, decision, note, moderated_by)
  values(target_place_id, decision, note, auth.uid());

  return result;
end;
$$;

revoke all on function public.moderate_place(uuid, text, text) from public;
grant execute on function public.moderate_place(uuid, text, text) to authenticated;

commit;

-- Verification after running:
-- select column_name, column_default, is_nullable
-- from information_schema.columns
-- where table_schema = 'public'
--   and table_name = 'places'
--   and column_name in ('price_data_status', 'price_data_note')
-- order by column_name;
--
-- select routine_name
-- from information_schema.routines
-- where routine_schema = 'public'
--   and routine_name = 'moderate_place';
