import {fixtureDatabase} from './stays-db-fixture.mjs';
import {readFileSync} from 'node:fs';
export async function catalogDatabase(){
 const db=await fixtureDatabase();
 await db.exec(`
 alter table place_images add column rights_expires_at date;
 alter table price_items add column event_id uuid;
 create table place_secondary_types(place_id uuid,place_type text,primary key(place_id,place_type));
 create table events(id uuid primary key,slug text,name text,description text,address text,temporary_venue_name text,destination_id uuid,publication_status text,verification_status text);
 create table event_images(id uuid primary key,event_id uuid,image_url text,alt_text text,is_cover boolean,sort_order integer,approved_for_public boolean,takedown_status text,rights_expires_at date);
 create table event_schedules(id uuid primary key,event_id uuid,starts_at timestamptz,ends_at timestamptz,status text);
 grant select on place_secondary_types,events,event_images,event_schedules to anon,authenticated;
 alter table events enable row level security;
 create policy public_events on events for select using(publication_status='published');
 create policy owner_events on events for select to authenticated using(true);
 create policy public_event_prices on price_items for select using(exists(select 1 from events e where e.id=event_id and e.publication_status='published'));
 alter table places enable row level security;
 create policy owner_places on places for select to authenticated using(true);
 alter table place_secondary_types enable row level security;
 create policy public_types on place_secondary_types for select using(exists(select 1 from places p where p.id=place_id and p.publication_status='published'));
 alter table event_images enable row level security;
 create policy public_event_images on event_images for select using(exists(select 1 from events e where e.id=event_id and e.publication_status='published'));
 alter table event_schedules enable row level security;
 create policy public_schedules on event_schedules for select using(exists(select 1 from events e where e.id=event_id and e.publication_status='published'));
 insert into places(id,slug,name,description,address,destination_id,place_type,publication_status,verification_status)
 select ('60000000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid,'qa-'||t,'QA '||t,'Synthetic test only. Not a real listing.','QA address','10000000-0000-0000-0000-000000000001',t,'published','unverified'
 from unnest(array['restaurant','cafe','attraction','activity']) with ordinality a(t,n);
 insert into place_secondary_types values('60000000-0000-0000-0000-000000000001','cafe');
 insert into events values('70000000-0000-0000-0000-000000000001','qa-event','QA event','Synthetic event only',null,'QA venue','10000000-0000-0000-0000-000000000001','published','verified'),
 ('70000000-0000-0000-0000-000000000002','qa-private-event','Private draft event',null,null,null,null,'draft','unverified');
 insert into event_schedules values('71000000-0000-0000-0000-000000000001','70000000-0000-0000-0000-000000000001',now()+interval '2 days',now()+interval '3 days','scheduled'),
 ('71000000-0000-0000-0000-000000000002','70000000-0000-0000-0000-000000000001',now()+interval '1 day',now()+interval '2 days','cancelled');
 insert into price_items(id,event_id,amount_min,currency,price_unit,is_estimate) values('72000000-0000-0000-0000-000000000001','70000000-0000-0000-0000-000000000001',150,'THB','person',true);
 `);
 await db.exec(readFileSync(new URL('../supabase/migrations/031_unified_public_search.sql',import.meta.url),'utf8'));
 return db;
}
export async function catalogQuery(db,args={}){
 const keys=['p_query','p_destination','p_guests','p_pet','p_parking','p_accessible','p_verified','p_max_price','p_sort','p_page','p_type'];
 const types=['text','text','integer','boolean','boolean','boolean','boolean','numeric','text','integer','text'];
 const defaults=['','',null,false,false,false,false,null,'name',1,'all'];
 const values=keys.map((k,i)=>k in args?args[k]:defaults[i]);
 return (await db.query(`select search_public_catalog(${types.map((t,i)=>`$${i+1}::${t}`).join(',')}) as result`,values)).rows[0].result;
}
