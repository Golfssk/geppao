-- Additive guardrails. Never publishes or rewrites existing records.
begin;

-- Run as the caller's JWT identity even when reached from a SECURITY DEFINER RPC.
create or replace function public.guard_editorial_state()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
  if public.is_geppao_admin() then return new; end if;
  if tg_op='INSERT' then
    if new.publication_status not in ('draft','pending') or new.verification_status<>'unverified'
      or new.last_verified_at is not null or new.moderated_by is not null
      or new.moderated_at is not null or new.moderation_note is not null
      or nullif(to_jsonb(new)->>'legacy_listing_id','') is not null then
      raise exception 'Only Admin may set verification or publication approval' using errcode='42501';
    end if;
  else
    if new.id is distinct from old.id or new.business_id is distinct from old.business_id
      or (to_jsonb(new)->'legacy_listing_id') is distinct from (to_jsonb(old)->'legacy_listing_id') then
      raise exception 'Place/Event identity cannot be reassigned by an editor' using errcode='42501';
    end if;
    if new.verification_status is distinct from old.verification_status
      or new.last_verified_at is distinct from old.last_verified_at
      or new.moderated_by is distinct from old.moderated_by
      or new.moderated_at is distinct from old.moderated_at
      or new.moderation_note is distinct from old.moderation_note
      or (new.publication_status is distinct from old.publication_status
        and new.publication_status not in ('draft','pending','archived')) then
      raise exception 'Only Admin may set verification or publication approval' using errcode='42501';
    end if;
    -- Any business edit invalidates old verification. No owner self-approval after editing.
    if new is distinct from old then
      if new.publication_status='published' then new.publication_status:='draft'; end if;
      new.verification_status:='unverified'; new.last_verified_at:=null;
      new.moderated_by:=null; new.moderated_at:=null; new.moderation_note:=null;
    end if;
  end if;
  return new;
end $$;
revoke all on function public.guard_editorial_state() from public,anon,authenticated;
create trigger enforce_place_editorial_state before insert or update on public.places
  for each row execute function public.guard_editorial_state();
create trigger enforce_event_editorial_state before insert or update on public.events
  for each row execute function public.guard_editorial_state();

create or replace function public.guard_media_approval()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
  if public.is_geppao_admin() then return new; end if;
  if tg_op='INSERT' then
    if new.approved_for_public or new.approved_by is not null or new.approved_at is not null then
      raise exception 'Only Admin may approve media' using errcode='42501';
    end if;
  else
    if new.id is distinct from old.id
      or (to_jsonb(new)->tg_argv[0]) is distinct from (to_jsonb(old)->tg_argv[0]) then
      raise exception 'Media identity cannot be reassigned' using errcode='42501';
    end if;
    if new.approved_for_public is distinct from old.approved_for_public
      or new.approved_by is distinct from old.approved_by
      or new.approved_at is distinct from old.approved_at then
      raise exception 'Only Admin may approve media' using errcode='42501';
    end if;
    -- Replacing a URL or editing rights evidence always requires a new approval.
    if (to_jsonb(new)-array['sort_order','is_cover','alt_text'])
       is distinct from (to_jsonb(old)-array['sort_order','is_cover','alt_text']) then
      new.approved_for_public:=false; new.approved_by:=null; new.approved_at:=null;
    end if;
  end if;
  return new;
end $$;
revoke all on function public.guard_media_approval() from public,anon,authenticated;
create trigger enforce_place_media_approval before insert or update on public.place_images
  for each row execute function public.guard_media_approval('place_id');
create trigger enforce_event_media_approval before insert or update on public.event_images
  for each row execute function public.guard_media_approval('event_id');

-- Owner edits to child data also return the parent to review; guards apply to direct SQL/REST.
create or replace function public.invalidate_edited_parent()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare row_data jsonb; target_id uuid;
begin
  if public.is_geppao_admin() then return null; end if;
  if tg_op='UPDATE' and new is not distinct from old then return null; end if;
  -- Check both parents on reassignment. Rows remain governed by their existing RLS policies.
  for row_data in select value from jsonb_array_elements(
    case when tg_op='INSERT' then jsonb_build_array(to_jsonb(new))
         when tg_op='DELETE' then jsonb_build_array(to_jsonb(old))
         else jsonb_build_array(to_jsonb(old),to_jsonb(new)) end
  ) loop
    target_id:=nullif(row_data->>'place_id','')::uuid;
    if target_id is not null then
      update public.places set publication_status=case when publication_status='archived' then 'archived' else 'draft' end,
        updated_at=clock_timestamp() where id=target_id;
    end if;
    target_id:=nullif(row_data->>'event_id','')::uuid;
    if target_id is not null then
      update public.events set publication_status=case when publication_status='archived' then 'archived' else 'draft' end,
        updated_at=clock_timestamp() where id=target_id;
    end if;
  end loop;
  return null;
end $$;
revoke all on function public.invalidate_edited_parent() from public,anon,authenticated;
do $$ declare t text; begin
  foreach t in array array['place_images','place_hours','place_special_hours','price_items',
    'accommodation_details','dining_details','attraction_details','activity_details','event_images','event_schedules'] loop
    execute format('create trigger invalidate_parent_after_editor_change after insert or update or delete on public.%I for each row execute function public.invalidate_edited_parent()',t);
  end loop;
end $$;

-- Defense in depth: even a direct Admin status update must pass the same publication gate.
create or replace function public.enforce_publishable_place()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
  if new.publication_status='published' then
    if nullif(btrim(new.description),'') is null or nullif(btrim(new.address),'') is null
      or new.latitude is null or new.longitude is null or new.recommended_duration_minutes is null
      or not exists(select 1 from public.place_sources s where s.place_id=new.id)
      or not exists(select 1 from public.place_images i where i.place_id=new.id and i.is_cover
        and i.approved_for_public and i.takedown_status='active'
        and i.image_url ~ '^https://[^/]+/storage/v1/object/public/place-images/'
        and exists(select 1 from storage.objects o where o.bucket_id='place-images'
          and i.image_url like '%/storage/v1/object/public/place-images/'||o.name)
        and (i.rights_expires_at is null or i.rights_expires_at>=current_date))
      or (new.place_type='accommodation' and not exists(select 1 from public.accommodation_details a
          where a.place_id=new.id and a.check_in_time is not null and a.check_out_time is not null))
      or (new.place_type<>'accommodation' and not exists(select 1 from public.place_hours h where h.place_id=new.id))
      or not (new.price_data_status in ('free','missing','not_applicable')
        or (new.price_data_status='available' and exists(select 1 from public.price_items pi where pi.place_id=new.id))) then
      raise exception 'Publication requires complete data and an approved, unexpired cover image' using errcode='23514';
    end if;
  end if;
  return null;
end $$;
revoke all on function public.enforce_publishable_place() from public,anon,authenticated;
create trigger check_place_before_publication after insert or update on public.places
  for each row execute function public.enforce_publishable_place();

-- Allow Admins to review owner-submitted images too, not just unclaimed Places.
drop policy if exists "Admins upload curation place images" on storage.objects;
create policy "Admins upload curation place images" on storage.objects for insert to authenticated
  with check(bucket_id='place-images' and public.is_geppao_admin()
    and (storage.foldername(name))[1]='admin'
    and exists(select 1 from public.places p where p.id::text=(storage.foldername(objects.name))[2]));

-- A public URL must not retain its old approval after the owner replaces the storage bytes.
-- Once any media in a Place/Event folder is approved, owner overwrite/delete needs Admin review.
create or replace function public.can_modify_media_folder(bucket text,object_name text)
returns boolean language sql stable security definer set search_path=public,pg_temp as $$
  select public.is_geppao_admin() or case
    when bucket='place-images' then not exists(select 1 from public.place_images i
      where i.place_id::text=(storage.foldername(object_name))[2] and i.approved_for_public)
    when bucket='event-images' then not exists(select 1 from public.event_images i
      where i.event_id::text=(storage.foldername(object_name))[2] and i.approved_for_public)
    else true end
$$;
revoke all on function public.can_modify_media_folder(text,text) from public,anon;
grant execute on function public.can_modify_media_folder(text,text) to authenticated;
create policy "Approved media folders require Admin overwrite" on storage.objects as restrictive
  for update to authenticated using(public.can_modify_media_folder(bucket_id,name))
  with check(public.can_modify_media_folder(bucket_id,name));
create policy "Approved media folders require Admin deletion" on storage.objects as restrictive
  for delete to authenticated using(public.can_modify_media_folder(bucket_id,name));

-- Qualify outer object names: unqualified name inside the subquery binds to p.name/e.name.
drop policy if exists "Business editors upload place images" on storage.objects;
create policy "Business editors upload place images" on storage.objects for insert to authenticated with check(bucket_id='place-images' and exists(select 1 from public.places p where p.id::text=(storage.foldername(objects.name))[2] and p.business_id::text=(storage.foldername(objects.name))[1] and public.is_business_editor(p.business_id)));
drop policy if exists "Business editors update place images" on storage.objects;
create policy "Business editors update place images" on storage.objects for update to authenticated using(bucket_id='place-images' and exists(select 1 from public.places p where p.id::text=(storage.foldername(objects.name))[2] and p.business_id::text=(storage.foldername(objects.name))[1] and public.is_business_editor(p.business_id))) with check(bucket_id='place-images' and exists(select 1 from public.places p where p.id::text=(storage.foldername(objects.name))[2] and p.business_id::text=(storage.foldername(objects.name))[1] and public.is_business_editor(p.business_id)));
drop policy if exists "Business editors delete place images" on storage.objects;
create policy "Business editors delete place images" on storage.objects for delete to authenticated using(bucket_id='place-images' and exists(select 1 from public.places p where p.id::text=(storage.foldername(objects.name))[2] and p.business_id::text=(storage.foldername(objects.name))[1] and public.is_business_editor(p.business_id)));
drop policy if exists "Business editors upload event images" on storage.objects;
create policy "Business editors upload event images" on storage.objects for insert to authenticated with check(bucket_id='event-images' and exists(select 1 from public.events e where e.id::text=(storage.foldername(objects.name))[2] and e.business_id::text=(storage.foldername(objects.name))[1] and public.is_business_editor(e.business_id)));
drop policy if exists "Business editors update event images" on storage.objects;
create policy "Business editors update event images" on storage.objects for update to authenticated using(bucket_id='event-images' and exists(select 1 from public.events e where e.id::text=(storage.foldername(objects.name))[2] and e.business_id::text=(storage.foldername(objects.name))[1] and public.is_business_editor(e.business_id))) with check(bucket_id='event-images' and exists(select 1 from public.events e where e.id::text=(storage.foldername(objects.name))[2] and e.business_id::text=(storage.foldername(objects.name))[1] and public.is_business_editor(e.business_id)));
drop policy if exists "Business editors delete event images" on storage.objects;
create policy "Business editors delete event images" on storage.objects for delete to authenticated using(bucket_id='event-images' and exists(select 1 from public.events e where e.id::text=(storage.foldername(objects.name))[2] and e.business_id::text=(storage.foldername(objects.name))[1] and public.is_business_editor(e.business_id)));
commit;
