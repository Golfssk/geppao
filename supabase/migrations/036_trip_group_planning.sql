-- Group planning on the existing free project. Additive; no directory changes.
begin;
set local lock_timeout='5s';set local statement_timeout='30s';
alter table public.trip_members add column display_name text not null default 'สมาชิก' check(length(display_name) between 1 and 80);
create table public.trip_invites(id uuid primary key default gen_random_uuid(),trip_id uuid not null references trips(id) on delete cascade,token_hash text not null unique,role text not null check(role in('editor','viewer')),expires_at timestamptz not null,created_at timestamptz not null default now(),revoked_at timestamptz,accepted_at timestamptz,accepted_by uuid);
create table public.trip_people(id uuid primary key default gen_random_uuid(),trip_id uuid not null references trips(id) on delete cascade,name text not null check(length(name) between 1 and 80),kind text not null default 'adult' check(kind in('adult','child','other')),created_at timestamptz not null default now(),unique(id,trip_id));
create table public.trip_expenses(id uuid primary key default gen_random_uuid(),trip_id uuid not null references trips(id) on delete cascade,title text not null check(length(title) between 1 and 200),amount_satang bigint not null check(amount_satang<>0 and abs(amount_satang)<=1000000000),payer_id uuid not null,shares jsonb not null,category text not null default 'other' check(category in('stay','food','transport','activity','other')),spent_on date not null default ((now() at time zone 'Asia/Bangkok')::date),version integer not null default 1,updated_by uuid not null,created_at timestamptz not null default now(),foreign key(payer_id,trip_id) references trip_people(id,trip_id));
create table public.trip_transfers(id uuid primary key default gen_random_uuid(),trip_id uuid not null references trips(id) on delete cascade,from_id uuid not null,to_id uuid not null,amount_satang bigint not null check(amount_satang>0 and amount_satang<=1000000000),created_at timestamptz not null default now(),foreign key(from_id,trip_id) references trip_people(id,trip_id),foreign key(to_id,trip_id) references trip_people(id,trip_id),check(from_id<>to_id));
create table public.trip_checklist(id uuid primary key default gen_random_uuid(),trip_id uuid not null references trips(id) on delete cascade,title text not null check(length(title) between 1 and 200),assignee_id uuid,due_on date,is_done boolean not null default false,version integer not null default 1,created_at timestamptz not null default now(),foreign key(assignee_id,trip_id) references trip_people(id,trip_id));
create table public.trip_polls(id uuid primary key default gen_random_uuid(),trip_id uuid not null references trips(id) on delete cascade,title text not null check(length(title) between 1 and 200),options jsonb not null,is_closed boolean not null default false,version integer not null default 1,created_at timestamptz not null default now());
create table public.trip_votes(poll_id uuid not null references trip_polls(id) on delete cascade,user_id uuid not null,option_index integer not null check(option_index>=0),primary key(poll_id,user_id));
create table public.trip_group_audit(id uuid primary key default gen_random_uuid(),trip_id uuid not null references trips(id) on delete cascade,actor_id uuid not null,action text not null,record_id uuid,previous jsonb,created_at timestamptz not null default now());
create table public.trip_reservations(id uuid primary key default gen_random_uuid(),trip_id uuid not null references trips(id) on delete cascade,owner_id uuid not null,title text not null check(length(title) between 1 and 200),kind text not null check(kind in('stay','transport','activity','other')),reference text not null default '' check(length(reference)<=200),starts_at timestamptz,ends_at timestamptz,deadline_at timestamptz,contact text not null default '' check(length(contact)<=500),notes text not null default '' check(length(notes)<=2000),version integer not null default 1,created_at timestamptz not null default now(),check(ends_at is null or starts_at is null or ends_at>=starts_at));
alter table public.trip_invites enable row level security;revoke all on public.trip_invites from public,anon,authenticated;grant select on public.trip_invites to authenticated;
alter table public.trip_people enable row level security;revoke all on public.trip_people from public,anon,authenticated;grant select on public.trip_people to authenticated;
alter table public.trip_expenses enable row level security;revoke all on public.trip_expenses from public,anon,authenticated;grant select on public.trip_expenses to authenticated;
alter table public.trip_transfers enable row level security;revoke all on public.trip_transfers from public,anon,authenticated;grant select on public.trip_transfers to authenticated;
alter table public.trip_checklist enable row level security;revoke all on public.trip_checklist from public,anon,authenticated;grant select on public.trip_checklist to authenticated;
alter table public.trip_polls enable row level security;revoke all on public.trip_polls from public,anon,authenticated;grant select on public.trip_polls to authenticated;
alter table public.trip_votes enable row level security;revoke all on public.trip_votes from public,anon,authenticated;grant select on public.trip_votes to authenticated;
alter table public.trip_group_audit enable row level security;revoke all on public.trip_group_audit from public,anon,authenticated;grant select on public.trip_group_audit to authenticated;
alter table public.trip_reservations enable row level security;revoke all on public.trip_reservations from public,anon,authenticated;grant select on public.trip_reservations to authenticated;
create policy "Members read trip_people" on public.trip_people for select to authenticated using(public.can_read_trip(trip_id));
create index trip_people_trip_idx on public.trip_people(trip_id);
create policy "Members read trip_expenses" on public.trip_expenses for select to authenticated using(public.can_read_trip(trip_id));
create index trip_expenses_trip_idx on public.trip_expenses(trip_id);
create policy "Members read trip_transfers" on public.trip_transfers for select to authenticated using(public.can_read_trip(trip_id));
create index trip_transfers_trip_idx on public.trip_transfers(trip_id);
create policy "Members read trip_checklist" on public.trip_checklist for select to authenticated using(public.can_read_trip(trip_id));
create index trip_checklist_trip_idx on public.trip_checklist(trip_id);
create policy "Members read trip_polls" on public.trip_polls for select to authenticated using(public.can_read_trip(trip_id));
create index trip_polls_trip_idx on public.trip_polls(trip_id);
create policy "Members read trip_group_audit" on public.trip_group_audit for select to authenticated using(public.can_read_trip(trip_id));
create index trip_group_audit_trip_idx on public.trip_group_audit(trip_id);
create policy "Owners read invitations" on public.trip_invites for select to authenticated using(exists(select 1 from trips t where t.id=trip_id and t.owner_user_id=auth.uid()));
create policy "Members read votes" on public.trip_votes for select to authenticated using(exists(select 1 from trip_polls p where p.id=poll_id and public.can_read_trip(p.trip_id)));
create policy "Personal reservation wallet" on public.trip_reservations for select to authenticated using(owner_id=auth.uid() and public.can_read_trip(trip_id));
create index trip_invites_trip_idx on public.trip_invites(trip_id);create index trip_reservations_trip_idx on public.trip_reservations(trip_id,owner_id);

create function public.create_trip_invite(target_trip_id uuid,member_role text) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare raw_token uuid:=gen_random_uuid();inv public.trip_invites;
begin
 if auth.uid() is null or not exists(select 1 from trips where id=target_trip_id and owner_user_id=auth.uid()) then raise exception 'Owner required' using errcode='42501';end if;
 perform 1 from trips where id=target_trip_id for update;
 if member_role not in('editor','viewer') or member_role is null then raise exception 'Invalid role' using errcode='22023';end if;
 if (select count(*) from trip_invites where trip_id=target_trip_id)>999 then raise exception 'Invitation quota reached' using errcode='22023';end if;
 insert into trip_invites(trip_id,token_hash,role,expires_at) values(target_trip_id,encode(sha256(convert_to(raw_token::text,'UTF8')),'hex'),member_role,now()+interval '7 days') returning * into inv;
 return jsonb_build_object('id',inv.id,'token',raw_token,'role',inv.role,'expires_at',inv.expires_at);
end $$;
create function public.inspect_trip_invite(invite_token uuid) returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$
declare result jsonb;
begin
 if auth.uid() is null then raise exception 'Sign in required' using errcode='42501';end if;
 select jsonb_build_object('title',t.title,'role',i.role,'expires_at',i.expires_at) into result from trip_invites i join trips t on t.id=i.trip_id where i.token_hash=encode(sha256(convert_to(invite_token::text,'UTF8')),'hex') and i.revoked_at is null and i.accepted_at is null and i.expires_at>now();
 return result;
end $$;
create function public.accept_trip_invite(invite_token uuid,member_name text) returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare inv public.trip_invites;target_id uuid;
begin
 if auth.uid() is null then raise exception 'Sign in required' using errcode='42501';end if;
 select trip_id into target_id from trip_invites where token_hash=encode(sha256(convert_to(invite_token::text,'UTF8')),'hex');
 perform 1 from trips where id=target_id for update;
 select * into inv from trip_invites where token_hash=encode(sha256(convert_to(invite_token::text,'UTF8')),'hex') for update;
 if not found or inv.revoked_at is not null or inv.accepted_at is not null or inv.expires_at<=now() then raise exception 'Invitation unavailable' using errcode='22023';end if;
 if length(trim(coalesce(member_name,''))) not between 1 and 80 then raise exception 'Display name required' using errcode='22023';end if;
 if not exists(select 1 from trips where id=inv.trip_id and owner_user_id=auth.uid()) then
  -- Existing membership is never silently upgraded or downgraded by a link.
  insert into trip_members(trip_id,user_id,role,display_name) values(inv.trip_id,auth.uid(),inv.role,trim(member_name)) on conflict do nothing;
 end if;
 update trip_invites set accepted_at=now(),accepted_by=auth.uid() where id=inv.id;
 return inv.trip_id;
end $$;
create function public.manage_trip_member(target_trip_id uuid,action text,payload jsonb) returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if auth.uid() is null or not exists(select 1 from trips where id=target_trip_id and owner_user_id=auth.uid()) then raise exception 'Owner required' using errcode='42501';end if;
 perform 1 from trips where id=target_trip_id for update;
 if action='revoke_invite' then update trip_invites set revoked_at=now() where id=(payload->>'id')::uuid and trip_id=target_trip_id and revoked_at is null;
 elsif action='remove_member' then delete from trip_members where trip_id=target_trip_id and user_id=(payload->>'id')::uuid;
 elsif action='set_role' and payload->>'role' in('editor','viewer') then update trip_members set role=payload->>'role' where trip_id=target_trip_id and user_id=(payload->>'id')::uuid;
 else raise exception 'Invalid action' using errcode='22023';end if;
 return found;
end $$;

create function public.mutate_trip_group(target_trip_id uuid,action text,payload jsonb) returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare result_id uuid;row_id uuid;person_id uuid;amount bigint;total bigint;entry jsonb;old_row jsonb;current_version integer;parent_trip uuid;opts jsonb;idx integer;cap integer;
begin
 if auth.uid() is null or not public.can_read_trip(target_trip_id) then raise exception 'Membership required' using errcode='42501';end if;
 -- Serialize group writes per trip; compare versions for edits so a stale tab cannot overwrite.
 perform 1 from trips where id=target_trip_id for update;
 if not public.can_read_trip(target_trip_id) then raise exception 'Membership required' using errcode='42501';end if;
 if action not in('vote','reservation_add','reservation_edit','reservation_remove') and not public.can_edit_trip(target_trip_id) then raise exception 'Edit permission required' using errcode='42501';end if;
 if jsonb_typeof(payload)<>'object' or octet_length(payload::text)>12000 then raise exception 'Invalid payload' using errcode='22023';end if;
 if (select count(*) from trip_group_audit where trip_id=target_trip_id)>=5000 then raise exception 'History quota reached' using errcode='22023';end if;
 if action='person_add' then
  if (select count(*) from trip_people where trip_id=target_trip_id)>=50 then raise exception '50 participants maximum' using errcode='22023';end if;
  insert into trip_people(trip_id,name,kind) values(target_trip_id,trim(payload->>'name'),coalesce(payload->>'kind','adult')) returning id into result_id;
 elsif action in('expense_add','expense_edit','expense_remove') then
  if action<>'expense_add' then
   select to_jsonb(e),e.version into old_row,current_version from trip_expenses e where id=(payload->>'id')::uuid and trip_id=target_trip_id for update;
   if not found or current_version is distinct from (payload->>'version')::integer then raise exception 'Expense changed' using errcode='40001';end if;
   result_id=(payload->>'id')::uuid;
  elsif (select count(*) from trip_expenses where trip_id=target_trip_id)>=1000 then raise exception 'Expense quota reached' using errcode='22023';end if;
  if action='expense_remove' then delete from trip_expenses where id=result_id;
  else
   amount=(payload->>'amount_satang')::bigint;person_id=(payload->>'payer_id')::uuid;
   if amount is null or amount=0 or abs(amount)>1000000000 or jsonb_typeof(payload->'shares') is distinct from 'array' or jsonb_array_length(payload->'shares') not between 1 and 50 then raise exception 'Invalid amount or split' using errcode='22023';end if;
   if not exists(select 1 from trip_people where id=person_id and trip_id=target_trip_id) then raise exception 'Payer outside trip' using errcode='22023';end if;
   total=0;opts='[]';
   for entry in select value from jsonb_array_elements(payload->'shares') loop
    person_id=(entry->>'participant_id')::uuid;
    if not exists(select 1 from trip_people where id=person_id and trip_id=target_trip_id) or opts @> jsonb_build_array(person_id) or entry->>'amount_satang' is null or (entry->>'amount_satang')!~'^-?[0-9]+$' or abs((entry->>'amount_satang')::bigint)>abs(amount) or (amount>0 and (entry->>'amount_satang')::bigint<0) or (amount<0 and (entry->>'amount_satang')::bigint>0) then raise exception 'Invalid split member' using errcode='22023';end if;
    opts=opts||jsonb_build_array(person_id);total=total+(entry->>'amount_satang')::bigint;
   end loop;
   if total<>amount then raise exception 'Split must exactly match total' using errcode='22023';end if;
   if action='expense_add' then
    insert into trip_expenses(trip_id,title,amount_satang,payer_id,shares,category,spent_on,updated_by) values(target_trip_id,trim(payload->>'title'),amount,(payload->>'payer_id')::uuid,payload->'shares',coalesce(payload->>'category','other'),coalesce(nullif(payload->>'spent_on','')::date,(now() at time zone 'Asia/Bangkok')::date),auth.uid()) returning id into result_id;
   else update trip_expenses set title=trim(payload->>'title'),amount_satang=amount,payer_id=(payload->>'payer_id')::uuid,shares=payload->'shares',category=coalesce(payload->>'category','other'),spent_on=coalesce(nullif(payload->>'spent_on','')::date,(now() at time zone 'Asia/Bangkok')::date),updated_by=auth.uid(),version=version+1 where id=result_id;end if;
  end if;
 elsif action='transfer_add' then
  if (select count(*) from trip_transfers where trip_id=target_trip_id)>=1000 then raise exception 'Transfer quota reached' using errcode='22023';end if;
  insert into trip_transfers(trip_id,from_id,to_id,amount_satang) values(target_trip_id,(payload->>'from_id')::uuid,(payload->>'to_id')::uuid,(payload->>'amount_satang')::bigint) returning id into result_id;
 elsif action='transfer_remove' then
  select to_jsonb(x),x.id into old_row,result_id from trip_transfers x where id=(payload->>'id')::uuid and trip_id=target_trip_id for update;
  if not found then raise exception 'Transfer unavailable' using errcode='40001';end if;delete from trip_transfers where id=result_id;
 elsif action='checklist_pack' then
  opts=case payload->>'pack' when 'family' then '["เตรียมยาประจำตัวและข้อมูลฉุกเฉิน","ตรวจอุปกรณ์และที่นั่งสำหรับเด็ก","เช็กเวลาเปิดและนัดหมายก่อนออกเดินทาง"]'::jsonb when 'pet' then '["ยืนยันเงื่อนไขสัตว์เลี้ยงกับแต่ละสถานที่","เตรียมสายจูง น้ำ และอุปกรณ์เก็บมูล","บันทึกเบอร์ติดต่อสัตวแพทย์ใกล้จุดหมาย"]'::jsonb when 'roadtrip' then '["ตรวจสภาพรถและเชื้อเพลิง","ตรวจเส้นทางและจุดพัก","เตรียมเอกสารและช่องทางติดต่อที่พัก"]'::jsonb else null end;
  if opts is null or (select count(*) from trip_checklist where trip_id=target_trip_id)>297 then raise exception 'Pack unavailable or quota reached' using errcode='22023';end if;
  for entry in select value from jsonb_array_elements(opts) loop
   if not exists(select 1 from trip_checklist where trip_id=target_trip_id and title=entry#>>'{}') then insert into trip_checklist(trip_id,title) values(target_trip_id,entry#>>'{}') returning id into result_id;end if;
  end loop;
 elsif action='checklist_add' then
  if (select count(*) from trip_checklist where trip_id=target_trip_id)>=300 then raise exception 'Checklist quota reached' using errcode='22023';end if;
  insert into trip_checklist(trip_id,title,assignee_id,due_on) values(target_trip_id,trim(payload->>'title'),nullif(payload->>'assignee_id','')::uuid,nullif(payload->>'due_on','')::date) returning id into result_id;
 elsif action in('checklist_toggle','checklist_remove') then
  select to_jsonb(c),c.version into old_row,current_version from trip_checklist c where id=(payload->>'id')::uuid and trip_id=target_trip_id for update;
  if not found or current_version is distinct from (payload->>'version')::integer then raise exception 'Checklist changed' using errcode='40001';end if;
  result_id=(payload->>'id')::uuid;
  if action='checklist_remove' then delete from trip_checklist where id=result_id;else update trip_checklist set is_done=(payload->>'is_done')::boolean,version=version+1 where id=result_id;end if;
 elsif action='poll_add' then
  if (select count(*) from trip_polls where trip_id=target_trip_id)>=100 then raise exception 'Poll quota reached' using errcode='22023';end if;
  opts=payload->'options';
  if jsonb_typeof(opts) is distinct from 'array' or jsonb_array_length(opts) not between 2 and 20 or exists(select 1 from jsonb_array_elements(opts) v where jsonb_typeof(v)<>'string' or length(trim(v#>>'{}')) not between 1 and 160) or (select count(distinct trim(value)) from jsonb_array_elements_text(opts))<>jsonb_array_length(opts) then raise exception 'Invalid poll options' using errcode='22023';end if;
  insert into trip_polls(trip_id,title,options) values(target_trip_id,trim(payload->>'title'),opts) returning id into result_id;
 elsif action='poll_toggle' then
  select to_jsonb(p),p.version into old_row,current_version from trip_polls p where id=(payload->>'id')::uuid and trip_id=target_trip_id for update;
  if not found or current_version is distinct from (payload->>'version')::integer then raise exception 'Poll changed' using errcode='40001';end if;
  result_id=(payload->>'id')::uuid;update trip_polls set is_closed=(payload->>'is_closed')::boolean,version=version+1 where id=result_id;
 elsif action='vote' then
  select options into opts from trip_polls where id=(payload->>'id')::uuid and trip_id=target_trip_id and not is_closed for update;
  if not found then raise exception 'Poll closed or unavailable' using errcode='22023';end if;
  idx=(payload->>'option_index')::integer;if idx is null or idx<0 or idx>=jsonb_array_length(opts) then raise exception 'Invalid option' using errcode='22023';end if;
  result_id=(payload->>'id')::uuid;insert into trip_votes(poll_id,user_id,option_index) values(result_id,auth.uid(),idx) on conflict(poll_id,user_id) do update set option_index=excluded.option_index;
 elsif action in('reservation_add','reservation_edit') then
  if action='reservation_edit' then
   select id into result_id from trip_reservations where id=(payload->>'id')::uuid and trip_id=target_trip_id and owner_id=auth.uid() and version=(payload->>'version')::integer for update;
   if not found then raise exception 'Reservation unavailable' using errcode='40001';end if;
   update trip_reservations set title=trim(payload->>'title'),kind=payload->>'kind',reference=coalesce(payload->>'reference',''),starts_at=nullif(payload->>'starts_at','')::timestamptz,ends_at=nullif(payload->>'ends_at','')::timestamptz,deadline_at=nullif(payload->>'deadline_at','')::timestamptz,contact=coalesce(payload->>'contact',''),notes=coalesce(payload->>'notes',''),version=version+1 where id=result_id;
  else
   if (select count(*) from trip_reservations where trip_id=target_trip_id and owner_id=auth.uid())>=100 then raise exception 'Reservation quota reached' using errcode='22023';end if;
   insert into trip_reservations(trip_id,owner_id,title,kind,reference,starts_at,ends_at,deadline_at,contact,notes) values(target_trip_id,auth.uid(),trim(payload->>'title'),payload->>'kind',coalesce(payload->>'reference',''),nullif(payload->>'starts_at','')::timestamptz,nullif(payload->>'ends_at','')::timestamptz,nullif(payload->>'deadline_at','')::timestamptz,coalesce(payload->>'contact',''),coalesce(payload->>'notes','')) returning id into result_id;
  end if;
 elsif action='reservation_remove' then
  select id into result_id from trip_reservations where id=(payload->>'id')::uuid and trip_id=target_trip_id and owner_id=auth.uid() and version=(payload->>'version')::integer for update;
  if not found then raise exception 'Reservation unavailable' using errcode='40001';end if;delete from trip_reservations where id=result_id;
 else raise exception 'Unsupported action' using errcode='22023';end if;
 -- Personal wallet values are never copied into shared group audit history.
 if action not in('reservation_add','reservation_edit','reservation_remove','vote') then insert into trip_group_audit(trip_id,actor_id,action,record_id,previous) values(target_trip_id,auth.uid(),action,result_id,old_row);end if;
 return result_id;
end $$;

create function public.get_trip_group_data(target_trip_id uuid) returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$
declare result jsonb;
begin
 if auth.uid() is null or not public.can_read_trip(target_trip_id) then raise exception 'Membership required' using errcode='42501';end if;
 select jsonb_build_object(
 'people',coalesce((select jsonb_agg(to_jsonb(p) order by created_at,id) from trip_people p where trip_id=target_trip_id),'[]'::jsonb),
 'expenses',coalesce((select jsonb_agg(to_jsonb(e) order by created_at desc,id) from trip_expenses e where trip_id=target_trip_id),'[]'::jsonb),
 'transfers',coalesce((select jsonb_agg(to_jsonb(x) order by created_at desc,id) from trip_transfers x where trip_id=target_trip_id),'[]'::jsonb),
 'checklist',coalesce((select jsonb_agg(to_jsonb(c) order by created_at,id) from trip_checklist c where trip_id=target_trip_id),'[]'::jsonb),
 'polls',coalesce((select jsonb_agg(to_jsonb(p) order by created_at,id) from trip_polls p where trip_id=target_trip_id),'[]'::jsonb),
 'votes',coalesce((select jsonb_agg(to_jsonb(v)) from trip_votes v join trip_polls p on p.id=v.poll_id where p.trip_id=target_trip_id),'[]'::jsonb),
 'members',coalesce((select jsonb_agg(jsonb_build_object('user_id',user_id,'role',role,'display_name',display_name)) from trip_members where trip_id=target_trip_id),'[]'::jsonb),
 'invites',case when exists(select 1 from trips where id=target_trip_id and owner_user_id=auth.uid()) then coalesce((select jsonb_agg(jsonb_build_object('id',id,'role',role,'expires_at',expires_at,'revoked_at',revoked_at,'accepted_at',accepted_at) order by created_at desc) from trip_invites where trip_id=target_trip_id),'[]'::jsonb) else '[]'::jsonb end,
 'reservations',coalesce((select jsonb_agg(to_jsonb(r) order by created_at desc,id) from trip_reservations r where trip_id=target_trip_id and owner_id=auth.uid()),'[]'::jsonb),
 'history',coalesce((select jsonb_agg(to_jsonb(a)) from (select action,record_id,created_at from trip_group_audit where trip_id=target_trip_id order by created_at desc limit 50) a),'[]'::jsonb)
 ) into result;return result;
end $$;

revoke all on function public.create_trip_invite(uuid,text),public.inspect_trip_invite(uuid),public.accept_trip_invite(uuid,text),public.manage_trip_member(uuid,text,jsonb),public.mutate_trip_group(uuid,text,jsonb),public.get_trip_group_data(uuid) from public,anon;
grant execute on function public.create_trip_invite(uuid,text),public.inspect_trip_invite(uuid),public.accept_trip_invite(uuid,text),public.manage_trip_member(uuid,text,jsonb),public.mutate_trip_group(uuid,text,jsonb),public.get_trip_group_data(uuid) to authenticated;
commit;
