begin;
-- Public basic directory records are distinct from fully curated/verified listings.
-- Existing curated publication/media gates remain unchanged. No photo/review-text license is asserted.
alter table public.places add column catalog_level text not null default 'curated' check(catalog_level in('curated','directory'));
alter table public.places add column directory_source_row_id uuid unique references public.workbook_import_rows(id) on delete restrict;
alter table public.places add column directory_facts jsonb check(directory_facts is null or jsonb_typeof(directory_facts)='object');
create or replace function public.guard_directory_provenance() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if not public.is_geppao_admin() then
  if (tg_op='INSERT' and (new.catalog_level<>'curated' or new.directory_source_row_id is not null or new.directory_facts is not null))
   or (tg_op='UPDATE' and (new.catalog_level is distinct from old.catalog_level or new.directory_source_row_id is distinct from old.directory_source_row_id or new.directory_facts is distinct from old.directory_facts)) then
   raise exception 'Only Admin manages directory publication and provenance' using errcode='42501';
  end if;
 end if;
 return new;
end $$;
create trigger guard_directory_provenance before insert or update on public.places for each row execute function public.guard_directory_provenance();
create or replace function public.enforce_publishable_place()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
  if new.catalog_level='directory' and new.publication_status='published' then
    if nullif(btrim(new.name),'') is null or new.latitude is null or new.longitude is null
      or coalesce(new.google_maps_url,'') !~ '^https://www[.]google[.]com/maps/'
      or new.verification_status='verified'
      or new.directory_source_row_id is null or new.directory_facts is null
      or not exists(select 1 from public.workbook_import_rows r join public.workbook_import_batches b on b.id=r.batch_id
         where r.id=new.directory_source_row_id and r.matched_place_id=new.id and b.status='ready') then
      raise exception 'Directory publication requires a linked ready source, name, coordinates and safe map; not owner-verified' using errcode='23514';
    end if;
    return null;
  end if;
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

create or replace function public.admin_publish_workbook(p_batch uuid) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare b public.workbook_import_batches; r public.workbook_import_rows; ids uuid[]; target uuid; typ text; cat text; facts jsonb; n_new integer:=0; n_linked integer:=0; n_held integer:=0;
begin
 if not public.is_geppao_admin() then raise exception 'Admin access required' using errcode='42501'; end if;
 select * into b from public.workbook_import_batches where id=p_batch for update;
 if not found or b.status<>'ready' then raise exception 'Ready workbook required' using errcode='22023'; end if;
 if (select count(*) from public.workbook_import_rows where batch_id=p_batch)<>b.expected_rows then raise exception 'Workbook row count mismatch'; end if;
 -- Serialize imports across batches, preventing duplicate concurrent publications.
 perform pg_advisory_xact_lock(hashtext('geppao-workbook-directory-publication'));
 for r in select * from public.workbook_import_rows where batch_id=p_batch order by sheet_name,sheet_row for update loop
  if r.matched_place_id is not null or r.review_status='rejected' then continue; end if;
  if r.source_latitude is null or r.source_longitude is null or coalesce(r.source_place_id,'') !~ '^[A-Za-z0-9_-]{10,200}$' or r.name ~ '[[:cntrl:]]' then
   n_held:=n_held+1; continue;
  end if;
  select array_agg(p.id) into ids from public.places p
   where p.id in(select rr.matched_place_id from public.workbook_import_rows rr where rr.source_place_id=r.source_place_id and rr.matched_place_id is not null)
    or strpos(coalesce(p.google_maps_url,''),r.source_place_id)>0
    or lower(regexp_replace(p.name,'[[:space:][:punct:]]','','g'))=lower(regexp_replace(r.name,'[[:space:][:punct:]]','','g'));
  if coalesce(cardinality(ids),0)>1 then n_held:=n_held+1;continue; end if;
  if cardinality(ids)=1 then
   update public.workbook_import_rows set matched_place_id=ids[1],review_status='reviewed' where id=r.id;
   n_linked:=n_linked+1;continue;
  end if;
  cat:=coalesce(r.raw_values->>5,'');
  -- Prefer business category over the search tab; a cafe returned by a villa search is not a villa.
  typ:=case
    when cat in('ร้านกาแฟ','ร้านน้ำชา','ร้านเบเกอรี่','คาเฟ่แมว') then 'cafe'
    when cat in('Villa','Holiday home','Chalet','Campground','Camping farm','Camping cabin','Resort hotel','Lodging','Hotel','3-star hotel','Serviced accommodation') then 'accommodation'
    when cat in('Tourist attraction','Scenic spot','Park','สวน','สถานที่ท่องเที่ยว') then 'attraction'
    when cat='Children''s camp' then 'activity'
    when r.sheet_name in('Pool Villa','ลานกางเต็นท์','คาเฟ่') then 'restaurant'
    else r.suggested_place_type end;
  facts:=jsonb_build_object('source','user_workbook','data_as_of',b.data_as_of,'rating',r.source_rating,'review_count',r.source_review_count,
    'category',cat,'source_tab',r.sheet_name,'price_text',nullif(nullif(btrim(r.raw_values->>4),'-'),''),
    'room_text',case when typ='accommodation' then nullif(nullif(btrim(r.raw_values->>6),'-'),'') else null end);
  insert into public.places(name,slug,place_type,destination_id,address,latitude,longitude,google_maps_url,
    catalog_level,directory_source_row_id,directory_facts,publication_status,verification_status,price_data_status)
  values(r.name,'directory-'||substr(encode(sha256(convert_to(r.source_place_id,'UTF8')),'hex'),1,24),typ,
    (select id from public.destinations where slug='pak-chong-khao-yai' and status='active'),
    nullif(nullif(btrim(r.raw_values->>7),'-'),''),r.source_latitude,r.source_longitude,
    'https://www.google.com/maps/search/?api=1&query='||r.source_latitude||','||r.source_longitude||'&query_place_id='||r.source_place_id,
    'directory',r.id,facts,'draft','unverified','unknown') returning id into target;
  update public.workbook_import_rows set matched_place_id=target,review_status='reviewed' where id=r.id;
  -- No fake duration, weekly hours, prices, room availability, amenity flags or owner verification.
  update public.places set publication_status='published' where id=target;
  n_new:=n_new+1;
 end loop;
 update public.workbook_import_batches set audit_summary=audit_summary||jsonb_build_object('directory_publication_requested_at',now(),'created_last_run',n_new,'linked_last_run',n_linked,'held_last_run',n_held) where id=p_batch;
 return jsonb_build_object('created',n_new,'linked',n_linked,'held',n_held);
end $$;
revoke all on function public.admin_publish_workbook(uuid) from public,anon;
grant execute on function public.admin_publish_workbook(uuid) to authenticated;
comment on column public.places.catalog_level is 'Directory: public basic facts from supplied source, not owner verified. Curated: existing full completeness and approved-cover requirements.';
comment on column public.places.directory_facts is 'Whitelisted factual workbook snapshot, date may be unknown. Not live Google data, licensed review text, availability or a Gebpao review.';
create or replace function public.admin_workbook_publication_summary(p_batch uuid) returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$
begin
 if not public.is_geppao_admin() then raise exception 'Admin access required' using errcode='42501';end if;
 return (select jsonb_build_object('published',count(*) filter(where p.publication_status='published'),'linked',count(*) filter(where p.id is not null and p.directory_source_row_id is distinct from r.id),'pending',count(*) filter(where p.publication_status is distinct from 'published'))
 from public.workbook_import_rows r left join public.places p on p.id=r.matched_place_id where r.batch_id=p_batch);
end $$;
revoke all on function public.admin_workbook_publication_summary(uuid) from public,anon;
grant execute on function public.admin_workbook_publication_summary(uuid) to authenticated;
commit;
