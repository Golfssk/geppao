-- Phase 18: type-aware publication timing gate and Admin accommodation details editor.
-- Additive migration. Does not publish, modify, or delete existing Place data.

begin;

create or replace function public.admin_upsert_accommodation_details(
  target_place_id uuid,
  details jsonb
)
returns public.accommodation_details
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.accommodation_details;
begin
  if not is_geppao_admin() then
    raise exception 'Admin access required';
  end if;

  if jsonb_typeof(details) <> 'object' then
    raise exception 'Accommodation details must be an object';
  end if;

  if not exists (
    select 1 from public.places p
    where p.id = target_place_id
      and p.business_id is null
      and p.place_type = 'accommodation'
  ) then
    raise exception 'Unclaimed accommodation Place not found';
  end if;

  insert into public.accommodation_details(
    place_id,
    accommodation_type,
    room_count,
    maximum_guests,
    check_in_time,
    check_out_time
  )
  values(
    target_place_id,
    nullif(btrim(details->>'accommodationType'), ''),
    nullif(details->>'roomCount', '')::integer,
    nullif(details->>'maximumGuests', '')::integer,
    nullif(details->>'checkInTime', '')::time,
    nullif(details->>'checkOutTime', '')::time
  )
  on conflict(place_id) do update set
    accommodation_type = excluded.accommodation_type,
    room_count = excluded.room_count,
    maximum_guests = excluded.maximum_guests,
    check_in_time = excluded.check_in_time,
    check_out_time = excluded.check_out_time
  returning * into result;

  return result;
end;
$$;

revoke all on function public.admin_upsert_accommodation_details(uuid, jsonb) from public;
grant execute on function public.admin_upsert_accommodation_details(uuid, jsonb) to authenticated;

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
      case
        when p.place_type = 'accommodation' and not exists (
          select 1 from public.accommodation_details details
          where details.place_id = p.id
            and details.check_in_time is not null
            and details.check_out_time is not null
        ) then 'check-in/out'
        when p.place_type <> 'accommodation' and not exists (
          select 1 from public.place_hours hours
          where hours.place_id = p.id
        ) then 'opening hours'
      end,
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

-- Verification (read-only):
-- select routine_name
-- from information_schema.routines
-- where routine_schema = 'public'
--   and routine_name in ('admin_upsert_accommodation_details', 'moderate_place')
-- order by routine_name;
