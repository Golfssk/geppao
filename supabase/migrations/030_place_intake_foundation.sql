-- Owned/licensed intake only. Google names/photos/reviews are NOT harvested or cached here.
begin;
alter table public.places
  add column if not exists facebook_url text,
  add column if not exists instagram_url text,
  add column if not exists booking_url text;
alter table public.accommodation_details
  add column if not exists pool_type text check(pool_type is null or pool_type in('none','shared','private')),
  add column if not exists bedroom_count integer check(bedroom_count is null or bedroom_count>=0),
  add column if not exists bathroom_count integer check(bathroom_count is null or bathroom_count>=0);

create table public.place_import_candidates(
  id uuid primary key default gen_random_uuid(), import_key text not null unique check(length(import_key) between 1 and 200),
  destination_id uuid not null references public.destinations(id), payload jsonb not null,
  source_kind text not null check(source_kind in('owner_submission','licensed_dataset','field_research')),
  source_url text, rights_basis text not null check(rights_basis in('owner_permission','licensed','geppao_collected')),
  permission_evidence text not null check(length(btrim(permission_evidence)) between 1 and 2000),
  checked_at timestamptz not null, rights_expires_at timestamptz,
  status text not null default 'staged' check(status in('staged','imported','linked','rejected')),
  matched_place_id uuid references public.places(id) on delete restrict,
  review_note text, created_by uuid not null references auth.users(id), reviewed_by uuid references auth.users(id),
  created_at timestamptz not null default now(), reviewed_at timestamptz,
  check(rights_expires_at is null or rights_expires_at>checked_at)
);
create index place_import_candidates_queue_idx on public.place_import_candidates(status,created_at desc);
create index place_import_candidates_destination_idx on public.place_import_candidates(destination_id);
create index place_import_candidates_place_idx on public.place_import_candidates(matched_place_id);
create index place_import_candidates_creator_idx on public.place_import_candidates(created_by);
create index place_import_candidates_reviewer_idx on public.place_import_candidates(reviewed_by);

create table public.place_external_ids(
  place_id uuid not null references public.places(id) on delete cascade,
  provider text not null check(provider='google_places'), external_id text not null check(length(external_id) between 1 and 300),
  created_at timestamptz not null default now(), primary key(provider,external_id)
);
create index place_external_ids_place_idx on public.place_external_ids(place_id);
create table public.place_field_evidence(
  id uuid primary key default gen_random_uuid(), place_id uuid not null references public.places(id) on delete cascade,
  candidate_id uuid references public.place_import_candidates(id) on delete restrict,
  field_name text not null, source_kind text not null, source_url text,
  rights_basis text not null, permission_evidence text not null,
  checked_at timestamptz not null, rights_expires_at timestamptz, checked_by uuid not null references auth.users(id)
);
create index place_field_evidence_lookup_idx on public.place_field_evidence(place_id,field_name,checked_at desc);
create index place_field_evidence_candidate_idx on public.place_field_evidence(candidate_id);
create index place_field_evidence_checker_idx on public.place_field_evidence(checked_by);
create table public.place_secondary_types(
  place_id uuid not null references public.places(id) on delete cascade,
  place_type text not null check(place_type in('accommodation','restaurant','cafe','attraction','activity')),
  primary key(place_id,place_type)
);

-- Intake tables cannot be directly mutated by browser roles, even by an Admin.
-- Mutations are bounded, authenticated RPCs; only Admin can read raw source evidence.
alter table public.place_import_candidates enable row level security;
alter table public.place_external_ids enable row level security;
alter table public.place_field_evidence enable row level security;
alter table public.place_secondary_types enable row level security;
revoke all on public.place_import_candidates,public.place_external_ids,public.place_field_evidence,public.place_secondary_types from public,anon,authenticated;
grant select on public.place_import_candidates,public.place_external_ids,public.place_field_evidence to authenticated;
grant select on public.place_secondary_types to anon,authenticated;
create policy "Admins read import candidates" on public.place_import_candidates for select to authenticated using(public.is_geppao_admin());
create policy "Admins read external IDs" on public.place_external_ids for select to authenticated using(public.is_geppao_admin());
create policy "Admins read field evidence" on public.place_field_evidence for select to authenticated using(public.is_geppao_admin());
create policy "Public published secondary types" on public.place_secondary_types for select using(exists(select 1 from public.places p where p.id=place_id and p.publication_status='published'));
create policy "Admins read secondary types" on public.place_secondary_types for select to authenticated using(public.is_geppao_admin());

-- Bound and validate payload in SQL too: direct RPC calls cannot bypass the API validator.
create or replace function public.validate_place_intake_payload(payload jsonb)
returns void language plpgsql set search_path=public,pg_temp as $$
declare key text; n numeric; secondary text;
begin
  if jsonb_typeof(payload) is distinct from 'object' or octet_length(payload::text)>20000 then
    raise exception 'Payload must be a bounded object' using errcode='22023'; end if;
  for key in select jsonb_object_keys(payload) loop
    if key not in ('destination_slug','place_type','name','description','address','latitude','longitude',
      'phone','line_id','email','website_url','facebook_url','instagram_url','booking_url','google_place_id',
      'accommodation_type','pool_type','bedroom_count','bathroom_count','maximum_guests','room_count',
      'check_in_time','check_out_time','secondary_types') then
      raise exception 'Unsupported intake field: %',key using errcode='22023'; end if;
    if key not in ('latitude','longitude','bedroom_count','bathroom_count','maximum_guests','room_count','secondary_types')
      and jsonb_typeof(payload->key) not in ('string','null') then
      raise exception 'Expected text field: %',key using errcode='22023'; end if;
    if key in ('website_url','facebook_url','instagram_url','booking_url')
      and nullif(payload->>key,'') is not null and ((payload->>key) !~ '^https?://[^[:space:]/]+(/[^[:space:]]*)?$'
        or (payload->>key) ~ '^https?://[^/]*@') then
      raise exception 'Invalid public URL: %',key using errcode='22023'; end if;
    if key<>'description' and key<>'secondary_types' and length(coalesce(payload->>key,''))>2000 then
      raise exception 'Field too long: %',key using errcode='22023'; end if;
  end loop;
  if length(btrim(coalesce(payload->>'name',''))) not between 2 and 120
    or length(btrim(coalesce(payload->>'address',''))) not between 2 and 1000
    or length(coalesce(payload->>'description',''))>5000
    or coalesce(payload->>'destination_slug','') !~ '^[a-z0-9-]{1,80}$'
    or coalesce(payload->>'place_type','') not in('accommodation','restaurant','cafe','attraction','activity') then
    raise exception 'Name, address, destination and type are required' using errcode='22023'; end if;
  for key in select unnest(array['latitude','longitude','bedroom_count','bathroom_count','maximum_guests','room_count']) loop
    if payload->key is not null and payload->key<>'null'::jsonb then
      if jsonb_typeof(payload->key)<>'number' then raise exception 'Expected number: %',key using errcode='22023'; end if;
      n:=(payload->>key)::numeric;
      if (key='latitude' and (n< -90 or n>90)) or (key='longitude' and (n< -180 or n>180))
        or (key not in('latitude','longitude') and (n<>trunc(n) or n<0 or n>100000))
        or (key='maximum_guests' and n<1) then raise exception 'Invalid number: %',key using errcode='22023'; end if;
    end if;
  end loop;
  if (nullif(payload->>'latitude','') is null)<>(nullif(payload->>'longitude','') is null) then
    raise exception 'Coordinates must be supplied as a pair' using errcode='22023'; end if;
  if nullif(payload->>'pool_type','') is not null and payload->>'pool_type' not in('none','shared','private') then
    raise exception 'Invalid pool type' using errcode='22023'; end if;
  for key in select unnest(array['check_in_time','check_out_time']) loop
    if nullif(payload->>key,'') is not null and payload->>key !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' then
      raise exception 'Invalid check-in/out time' using errcode='22023'; end if;
  end loop;
  if (nullif(payload->>'check_in_time','') is null)<>(nullif(payload->>'check_out_time','') is null) then
    raise exception 'Check-in/out must be supplied as a pair' using errcode='22023'; end if;
  if payload->>'place_type'<>'accommodation' and exists(select 1 from jsonb_each(payload) e
    where e.key in('accommodation_type','pool_type','bedroom_count','bathroom_count','maximum_guests','room_count','check_in_time','check_out_time')
      and e.value<>'null'::jsonb and e.value<>'""'::jsonb) then
    raise exception 'Accommodation fields require accommodation type' using errcode='22023'; end if;
  if payload ? 'secondary_types' then
    if jsonb_typeof(payload->'secondary_types')<>'array' or jsonb_array_length(payload->'secondary_types')>5 then
      raise exception 'Invalid secondary types' using errcode='22023'; end if;
    for secondary in select jsonb_array_elements_text(payload->'secondary_types') loop
      if secondary is null or secondary not in('accommodation','restaurant','cafe','attraction','activity') then
        raise exception 'Invalid secondary type' using errcode='22023'; end if;
    end loop;
  end if;
end $$;
revoke all on function public.validate_place_intake_payload(jsonb) from public,anon,authenticated;

create or replace function public.admin_stage_place_import(input_key text,input_payload jsonb,input_source jsonb)
returns public.place_import_candidates language plpgsql security definer set search_path=public,pg_temp as $$
declare result public.place_import_candidates; dest uuid; checked timestamptz; expiry timestamptz;
begin
  if auth.uid() is null or not public.is_geppao_admin() then raise exception 'Admin access required' using errcode='42501'; end if;
  perform public.validate_place_intake_payload(input_payload);
  if input_key is null or length(btrim(input_key)) not between 1 and 200
    or jsonb_typeof(input_source) is distinct from 'object' or octet_length(input_source::text)>6000
    or coalesce(input_source->>'source_kind','') not in('owner_submission','licensed_dataset','field_research')
    or coalesce(input_source->>'rights_basis','') not in('owner_permission','licensed','geppao_collected')
    or input_source->'rights_confirmed' is distinct from 'true'::jsonb
    or length(btrim(coalesce(input_source->>'permission_evidence',''))) not between 1 and 2000 then
    raise exception 'Confirmed rights and permission evidence required' using errcode='22023'; end if;
  if exists(select 1 from jsonb_object_keys(input_source) k where k not in('source_kind','source_url','rights_basis','rights_confirmed','permission_evidence','checked_at','rights_expires_at')) then
    raise exception 'Unsupported source field' using errcode='22023'; end if;
  if (input_source->>'source_kind'='owner_submission' and input_source->>'rights_basis'<>'owner_permission')
    or (input_source->>'source_kind'='licensed_dataset' and input_source->>'rights_basis'<>'licensed')
    or (input_source->>'source_kind'='field_research' and input_source->>'rights_basis'<>'geppao_collected') then
    raise exception 'Source and rights basis must agree' using errcode='22023'; end if;
  if nullif(input_source->>'source_url','') is not null and
    (length(input_source->>'source_url')>2000 or input_source->>'source_url' !~ '^https?://[^[:space:]/]+(/[^[:space:]]*)?$'
      or input_source->>'source_url' ~ '^https?://[^/]*@') then
    raise exception 'Invalid source URL' using errcode='22023'; end if;
  checked:=nullif(input_source->>'checked_at','')::timestamptz;
  expiry:=nullif(input_source->>'rights_expires_at','')::timestamptz;
  if checked is null or checked>now() or (expiry is not null and (expiry<=now() or expiry<=checked)) then
    raise exception 'Invalid or expired source evidence' using errcode='22023'; end if;
  select id into dest from public.destinations where slug=input_payload->>'destination_slug' and status='active';
  if dest is null then raise exception 'Active destination not found' using errcode='22023'; end if;
  -- Same import key is an idempotent retry, never a silent overwrite.
  insert into public.place_import_candidates(import_key,destination_id,payload,source_kind,source_url,rights_basis,
    permission_evidence,checked_at,rights_expires_at,created_by)
  values(btrim(input_key),dest,input_payload,input_source->>'source_kind',nullif(input_source->>'source_url',''),
    input_source->>'rights_basis',input_source->>'permission_evidence',checked,expiry,auth.uid())
  on conflict(import_key) do nothing returning * into result;
  if result.id is null then
    select * into result from public.place_import_candidates where import_key=btrim(input_key);
    if result.payload is distinct from input_payload or result.source_kind is distinct from input_source->>'source_kind'
      or result.source_url is distinct from nullif(input_source->>'source_url','')
      or result.rights_basis is distinct from input_source->>'rights_basis'
      or result.permission_evidence is distinct from input_source->>'permission_evidence'
      or result.checked_at is distinct from checked or result.rights_expires_at is distinct from expiry then
      raise exception 'Import key already exists with different data' using errcode='23505'; end if;
  end if;
  return result;
end $$;
revoke all on function public.admin_stage_place_import(text,jsonb,jsonb) from public,anon;
grant execute on function public.admin_stage_place_import(text,jsonb,jsonb) to authenticated;

create or replace function public.admin_find_place_import_duplicates(candidate_id uuid)
returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$
declare c public.place_import_candidates; result jsonb;
begin
  if auth.uid() is null or not public.is_geppao_admin() then raise exception 'Admin access required' using errcode='42501'; end if;
  select * into c from public.place_import_candidates where id=candidate_id;
  if c.id is null then raise exception 'Candidate not found' using errcode='22023'; end if;
  select coalesce(jsonb_agg(jsonb_build_object('id',p.id,'name',p.name,'place_type',p.place_type,
    'publication_status',p.publication_status,'reason',case
      when ex.place_id is not null then 'external_id'
      when nullif(regexp_replace(p.phone,'[^0-9]','','g'),'')=nullif(regexp_replace(c.payload->>'phone','[^0-9]','','g'),'') then 'phone'
      when lower(regexp_replace(p.name,'[^[:alnum:]ก-๙]','','g'))=lower(regexp_replace(c.payload->>'name','[^[:alnum:]ก-๙]','','g')) then 'name'
      else 'nearby_same_type' end) order by p.name,p.id),'[]'::jsonb) into result
  from public.places p
  left join public.place_external_ids ex on ex.place_id=p.id and ex.provider='google_places' and ex.external_id=c.payload->>'google_place_id'
  where ex.place_id is not null or (p.destination_id=c.destination_id and (
    lower(regexp_replace(p.name,'[^[:alnum:]ก-๙]','','g'))=lower(regexp_replace(c.payload->>'name','[^[:alnum:]ก-๙]','','g'))
    or nullif(regexp_replace(p.phone,'[^0-9]','','g'),'')=nullif(regexp_replace(c.payload->>'phone','[^0-9]','','g'),'')
    or (p.place_type=c.payload->>'place_type' and p.latitude is not null and p.longitude is not null
      and nullif(c.payload->>'latitude','') is not null and nullif(c.payload->>'longitude','') is not null
      and 6371000*2*asin(sqrt(least(1.0,
        power(sin(radians(p.latitude-(c.payload->>'latitude')::float8)/2),2)
        +cos(radians(p.latitude))*cos(radians((c.payload->>'latitude')::float8))
        *power(sin(radians(p.longitude-(c.payload->>'longitude')::float8)/2),2))))<=100)
  ));
  return result;
end $$;
revoke all on function public.admin_find_place_import_duplicates(uuid) from public,anon;
grant execute on function public.admin_find_place_import_duplicates(uuid) to authenticated;

create or replace function public.admin_accept_place_import(candidate_id uuid,existing_place_id uuid default null,reviewed_distinct_ids uuid[] default '{}',distinct_reason text default null)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare c public.place_import_candidates; target uuid; matches jsonb; imported boolean;
begin
  if auth.uid() is null or not public.is_geppao_admin() then raise exception 'Admin access required' using errcode='42501'; end if;
  -- Serialize intake acceptance so a concurrent request cannot slip past duplicate review.
  perform pg_advisory_xact_lock(724612309);
  select * into c from public.place_import_candidates where id=candidate_id for update;
  if c.id is null then raise exception 'Candidate not found' using errcode='22023'; end if;
  if c.status in('imported','linked') then
    if existing_place_id is not null and existing_place_id is distinct from c.matched_place_id then
      raise exception 'Candidate already resolved to another Place' using errcode='23505'; end if;
    return jsonb_build_object('place_id',c.matched_place_id,'status',c.status,'existing',true);
  end if;
  if c.status<>'staged' or (c.rights_expires_at is not null and c.rights_expires_at<=now()) then
    raise exception 'Candidate is rejected or permission has expired' using errcode='22023'; end if;
  perform public.validate_place_intake_payload(c.payload);
  if not exists(select 1 from public.destinations where id=c.destination_id and status='active') then
    raise exception 'Destination is inactive' using errcode='22023'; end if;
  matches:=public.admin_find_place_import_duplicates(c.id);
  if existing_place_id is null and jsonb_array_length(matches)>0 then
    if cardinality(coalesce(reviewed_distinct_ids,'{}'::uuid[]))<>jsonb_array_length(matches)
      or array_position(reviewed_distinct_ids,null) is not null
      or cardinality(reviewed_distinct_ids)<>(select count(distinct d.v) from unnest(reviewed_distinct_ids) d(v))
      or exists(select 1 from jsonb_array_elements(matches) m where not (m->>'id')::uuid=any(coalesce(reviewed_distinct_ids,'{}'::uuid[])))
      or length(btrim(coalesce(distinct_reason,''))) not between 10 and 2000 then
      raise exception 'Possible duplicates found; review and link to an existing Place or record a distinct-venue decision' using errcode='23505'; end if;
  end if;
  if existing_place_id is not null then
    if not exists(select 1 from jsonb_array_elements(matches) m where m->>'id'=existing_place_id::text) then
      raise exception 'Existing Place must be a reviewed duplicate suggestion' using errcode='22023'; end if;
    target:=existing_place_id; imported:=false;
    -- Linking does not overwrite ANY existing fields or their provenance.
  else
    target:=gen_random_uuid(); imported:=true;
    insert into public.places(id,destination_id,place_type,name,slug,description,address,latitude,longitude,
      phone,line_id,email,website_url,facebook_url,instagram_url,booking_url,publication_status,verification_status)
    values(target,c.destination_id,c.payload->>'place_type',btrim(c.payload->>'name'),'import-'||target::text,
      nullif(c.payload->>'description',''),btrim(c.payload->>'address'),nullif(c.payload->>'latitude','')::float8,
      nullif(c.payload->>'longitude','')::float8,nullif(c.payload->>'phone',''),nullif(c.payload->>'line_id',''),
      nullif(c.payload->>'email',''),nullif(c.payload->>'website_url',''),nullif(c.payload->>'facebook_url',''),
      nullif(c.payload->>'instagram_url',''),nullif(c.payload->>'booking_url',''),'draft','unverified');
    if c.payload->>'place_type'='accommodation' then
      insert into public.accommodation_details(place_id,accommodation_type,pool_type,bedroom_count,bathroom_count,
        maximum_guests,room_count,check_in_time,check_out_time)
      values(target,nullif(c.payload->>'accommodation_type',''),nullif(c.payload->>'pool_type',''),
        nullif(c.payload->>'bedroom_count','')::integer,nullif(c.payload->>'bathroom_count','')::integer,
        nullif(c.payload->>'maximum_guests','')::integer,nullif(c.payload->>'room_count','')::integer,
        nullif(c.payload->>'check_in_time','')::time,nullif(c.payload->>'check_out_time','')::time);
    end if;
    insert into public.place_secondary_types(place_id,place_type)
      select target,t from jsonb_array_elements_text(coalesce(c.payload->'secondary_types','[]'::jsonb)) t
        where t<>c.payload->>'place_type' on conflict do nothing;
    insert into public.place_field_evidence(place_id,candidate_id,field_name,source_kind,source_url,rights_basis,
      permission_evidence,checked_at,rights_expires_at,checked_by)
      select target,c.id,key,c.source_kind,c.source_url,c.rights_basis,c.permission_evidence,c.checked_at,c.rights_expires_at,auth.uid()
      from jsonb_each(c.payload) where value<>'null'::jsonb and value<>'""'::jsonb
        and key not in('destination_slug','google_place_id');
  end if;
  if nullif(c.payload->>'google_place_id','') is not null then
    insert into public.place_external_ids(place_id,provider,external_id) values(target,'google_places',c.payload->>'google_place_id')
      on conflict(provider,external_id) do nothing;
    if not exists(select 1 from public.place_external_ids where provider='google_places'
      and external_id=c.payload->>'google_place_id' and place_id=target) then
      raise exception 'External ID belongs to another Place' using errcode='23505'; end if;
  end if;
  insert into public.place_sources(place_id,source_type,source_url,source_note,checked_at,checked_by)
    values(target,c.source_kind,c.source_url,'Intake '||c.id||': '||c.permission_evidence,c.checked_at,auth.uid());
  update public.place_import_candidates set status=case when imported then 'imported' else 'linked' end,
    matched_place_id=target,reviewed_by=auth.uid(),reviewed_at=now(),
    review_note=case when imported and jsonb_array_length(matches)>0 then
      jsonb_build_object('distinct_ids',reviewed_distinct_ids,'reason',distinct_reason)::text else null end where id=c.id;
  return jsonb_build_object('place_id',target,'status',case when imported then 'imported' else 'linked' end,'existing',false);
end $$;
revoke all on function public.admin_accept_place_import(uuid,uuid,uuid[],text) from public,anon;
grant execute on function public.admin_accept_place_import(uuid,uuid,uuid[],text) to authenticated;

create or replace function public.admin_reject_place_import(candidate_id uuid,reason text)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
  if auth.uid() is null or not public.is_geppao_admin() then raise exception 'Admin access required' using errcode='42501'; end if;
  if length(btrim(coalesce(reason,''))) not between 1 and 2000 then raise exception 'Rejection note required' using errcode='22023'; end if;
  update public.place_import_candidates set status='rejected',review_note=reason,reviewed_by=auth.uid(),reviewed_at=now()
    where id=candidate_id and status='staged';
  if not found then raise exception 'Unresolved candidate not found' using errcode='22023'; end if;
end $$;
revoke all on function public.admin_reject_place_import(uuid,text) from public,anon;
grant execute on function public.admin_reject_place_import(uuid,text) to authenticated;

-- Admin must see unpublished type details to review them (public/member RLS stays intact).
do $$ declare t text; begin
  foreach t in array array['accommodation_details','dining_details','attraction_details','activity_details'] loop
    execute format('create policy "Admins read unpublished type details" on public.%I for select to authenticated using(public.is_geppao_admin())',t);
  end loop;
end $$;
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
    check_out_time,
    pool_type, bedroom_count, bathroom_count
  )
  values(
    target_place_id,
    nullif(btrim(details->>'accommodationType'), ''),
    nullif(details->>'roomCount', '')::integer,
    nullif(details->>'maximumGuests', '')::integer,
    nullif(details->>'checkInTime', '')::time,
    nullif(details->>'checkOutTime', '')::time,
    nullif(details->>'pool_type', ''),
    nullif(details->>'bedroom_count', '')::integer,
    nullif(details->>'bathroom_count', '')::integer
  )
  on conflict(place_id) do update set
    accommodation_type = excluded.accommodation_type,
    room_count = excluded.room_count,
    maximum_guests = excluded.maximum_guests,
    check_in_time = excluded.check_in_time,
    check_out_time = excluded.check_out_time,
    pool_type = case when details ? 'pool_type' then excluded.pool_type else accommodation_details.pool_type end,
    bedroom_count = case when details ? 'bedroom_count' then excluded.bedroom_count else accommodation_details.bedroom_count end,
    bathroom_count = case when details ? 'bathroom_count' then excluded.bathroom_count else accommodation_details.bathroom_count end
  returning * into result;

  return result;
end;
$$;

revoke all on function public.admin_upsert_accommodation_details(uuid, jsonb) from public;
grant execute on function public.admin_upsert_accommodation_details(uuid, jsonb) to authenticated;

commit;
