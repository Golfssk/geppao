import {PGlite} from '@electric-sql/pglite';
import {readFileSync} from 'node:fs';
export async function fixtureDatabase() {
  const db = new PGlite();
  await db.exec(`
    create role anon; create role authenticated;
    create table destinations(id uuid primary key,slug text,name text,status text);
    create table places(id uuid primary key,slug text,name text,description text,address text,destination_id uuid,
      place_type text,publication_status text,verification_status text,last_verified_at timestamptz,
      pet_friendly boolean,parking_available boolean,accessibility_supported boolean);
    create table accommodation_details(place_id uuid primary key, maximum_guests integer,check_in_time time,check_out_time time);
    create table place_images(id uuid primary key,place_id uuid,image_url text,alt_text text,is_cover boolean,sort_order integer,approved_for_public boolean default false,takedown_status text default 'active');
    create table price_items(id uuid primary key,place_id uuid,amount_min numeric,amount_max numeric,currency text,price_unit text,is_estimate boolean);
    grant usage on schema public to anon,authenticated;
    grant select on all tables in schema public to anon,authenticated;
    alter table places enable row level security;
    create policy public_places on places for select to anon,authenticated using (publication_status='published');
    alter table place_images enable row level security;
    create policy public_images on place_images for select to anon,authenticated using(exists(select 1 from places p where p.id=place_id and p.publication_status='published'));
    alter table accommodation_details enable row level security;
    create policy public_details on accommodation_details for select to anon,authenticated using(exists(select 1 from places p where p.id=place_id and p.publication_status='published'));
    alter table price_items enable row level security;
    create policy public_prices on price_items for select to anon,authenticated using(exists(select 1 from places p where p.id=place_id and p.publication_status='published'));
    insert into destinations values('10000000-0000-0000-0000-000000000001','pak-chong-khao-yai','ปากช่อง–เขาใหญ่','active');
    insert into places
    select ('20000000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid,'qa-stay-'||n,'QA fixture stay '||lpad(n::text,2,'0'),
      'Synthetic test data only. Not a real property or bookable offer.','QA • ปากช่อง',
      '10000000-0000-0000-0000-000000000001','accommodation',case when n=16 then 'pending' else 'published' end,
      case when n % 2 = 0 then 'verified' else 'unverified' end,null,case when n % 3=0 then true else null end,true,null
    from generate_series(1,16) n;
    insert into accommodation_details select id,case when slug='qa-stay-1' then null else 4 end,'14:00','11:00' from places;
    insert into price_items select ('30000000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid,
      ('20000000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid,n*100,n*100+50,'THB','night',true from generate_series(1,16)n where n<>15;
    -- A cheaper per-person/USD record must never become the headline nightly price.
    insert into price_items values('40000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001',1,null,'USD','person',false);
    insert into place_images values('50000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','https://not-approved.example/image.jpg',null,true,0,false,'active');
    create policy owner_image_fixture on place_images for select to authenticated using(true);
  `);
  await db.exec(readFileSync(new URL('../supabase/migrations/028_public_stay_search.sql',import.meta.url),'utf8'));
  return db;
}
export async function queryFixture(db,args={}) {
  const keys=['p_query','p_destination','p_guests','p_pet','p_parking','p_accessible','p_verified','p_max_price','p_sort','p_page'];
  const cast=['text','text','integer','boolean','boolean','boolean','boolean','numeric','text','integer'];
  const defaults=['','',null,false,false,false,false,null,'name',1];
  const params=keys.map((key,i)=>key in args?args[key]:defaults[i]);
  const result=await db.query(`select search_public_stays(${params.map((_,i)=>`$${i+1}::${cast[i]}`).join(',')}) as result`,params);
  return result.rows[0].result;
}
