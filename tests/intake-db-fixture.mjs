import {PGlite} from '@electric-sql/pglite';
import {readFileSync,readdirSync} from 'node:fs';
export const ADMIN='a1000000-0000-0000-0000-000000000001',OWNER='a1000000-0000-0000-0000-000000000002',OTHER='a1000000-0000-0000-0000-000000000003';
export async function intakeDatabase(){
 const db=new PGlite();
 await db.exec(`create role anon;create role authenticated;create schema auth;create schema storage;
 create table auth.users(id uuid primary key,email text);
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 create function auth.role() returns text language sql stable as $$select current_setting('request.jwt.claim.role',true)$$;
 create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text,owner uuid);
 alter table storage.objects enable row level security;grant all on storage.objects to authenticated;
 create function storage.foldername(text) returns text[] language sql immutable as $$select string_to_array($1,'/')$$;
 grant usage on schema public,auth,storage to anon,authenticated;
 alter default privileges in schema public grant all on tables to anon,authenticated;
 alter default privileges in schema public grant all on sequences to anon,authenticated;
 insert into auth.users values('${ADMIN}','admin@fixture.invalid'),('${OWNER}','owner@fixture.invalid'),('${OTHER}','other@fixture.invalid');
 `);
 const dir=new URL('../supabase/migrations/',import.meta.url);
 // Real repository migration SQL; only pgcrypto extension removed because PGlite lacks it.
 // gen_random_uuid() is built-in; storage/auth above are test doubles, not Supabase runtime QA.
 for(const f of readdirSync(dir).filter(f=>/^\d{3}.*\.sql$/.test(f)).sort()){
  try{await db.exec(readFileSync(new URL(f,dir),'utf8').replace(/create extension if not exists pgcrypto;/gi,''))}
  catch(e){await db.close();throw new Error(`${f}: ${e.message}`)}
 }
 await db.exec(`insert into public.admin_users(user_id,role) values('${ADMIN}','admin');
 insert into public.businesses(id,name,status) values('b1000000-0000-0000-0000-000000000001','Synthetic test business','active');
 insert into public.business_members values('b1000000-0000-0000-0000-000000000001','${OWNER}','owner');`);
 return db;
}
export async function actor(db,id=ADMIN,role='authenticated'){
 await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claim.role',$2,false)",[id??'',role]);await db.exec(`set role ${role}`);
}
export const payload=(name='Synthetic QA cafe — not a real listing')=>({destination_slug:'pak-chong-khao-yai',place_type:'cafe',name,address:'Synthetic fixture address only'});
export const source=()=>({source_kind:'field_research',rights_basis:'geppao_collected',rights_confirmed:true,permission_evidence:'SYNTHETIC TEST ONLY — not permission for a real business',checked_at:'2026-01-01T00:00:00Z'});
export async function stage(db,key='fixture',p=payload(),s=source()){
 const {rows}=await db.query('select (public.admin_stage_place_import($1,$2::jsonb,$3::jsonb)).*',[key,JSON.stringify(p),JSON.stringify(s)]);return rows[0];
}
export async function accept(db,id,existing=null){const{rows}=await db.query('select public.admin_accept_place_import($1::uuid,$2::uuid) as result',[id,existing]);return rows[0].result}
