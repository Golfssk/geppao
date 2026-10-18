import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {intakeDatabase,actor,ADMIN,OWNER,OTHER} from './intake-db-fixture.mjs';
let db;
const migration=readFileSync(new URL('../supabase/migrations/040_internal_trigger_execute_boundary.sql',import.meta.url),'utf8');
before(async()=>{db=await intakeDatabase()});
after(async()=>{if(db)await db.close()});

test('internal trigger cannot be invoked directly by public API roles',async()=>{
 for(const role of ['anon','authenticated']){
  await db.exec('reset role');
  assert.equal((await db.query("select has_function_privilege($1,'public.guard_directory_provenance()','EXECUTE') as allowed",[role])).rows[0].allowed,false);
  await actor(db,role==='anon'?null:OWNER,role);
  await assert.rejects(db.query('select public.guard_directory_provenance()'),/permission denied/);
 }
});

test('existing attached trigger still permits ordinary business-owner creation and edits',async()=>{
 await actor(db,OWNER);
 const row=(await db.query("insert into public.places(name,slug,place_type,business_id) values('Synthetic privilege fixture','synthetic-trigger-privileges','cafe','b1000000-0000-0000-0000-000000000001') returning id,catalog_level")).rows[0];
 assert.equal(row.catalog_level,'curated');
 assert.equal((await db.query("update public.places set address='Synthetic fixture address' where id=$1 returning address",[row.id])).rows[0].address,'Synthetic fixture address');
 await actor(db,OTHER);
 assert.equal((await db.query('select id from public.places where id=$1',[row.id])).rows.length,0);
});

test('provenance guard still refuses owner forgery while admin workflow remains available',async()=>{
 await actor(db,OWNER);
 await assert.rejects(db.query("update public.places set directory_facts='{}'::jsonb where slug='synthetic-trigger-privileges'"),/Only Admin/);
 await assert.rejects(db.query("insert into public.places(name,slug,place_type,business_id,catalog_level) values('Synthetic forgery','synthetic-trigger-forgery','cafe','b1000000-0000-0000-0000-000000000001','directory')"),/Only Admin/);
 await actor(db,ADMIN);
 await db.query("update public.places set directory_facts='{}'::jsonb where slug='synthetic-trigger-privileges'");
 assert.deepEqual((await db.query("select directory_facts from public.places where slug='synthetic-trigger-privileges'")).rows[0].directory_facts,{});
});

test('migration is repeatable and preserves function body, trigger and service role privileges',async()=>{
 await db.exec('reset role; create role service_role; grant execute on function public.guard_directory_provenance() to public,anon,authenticated,service_role');
 const before=(await db.query("select pg_get_functiondef('public.guard_directory_provenance()'::regprocedure) as body,(select count(*)::int from pg_trigger where tgfoid='public.guard_directory_provenance()'::regprocedure) as attachments")).rows[0];
 await db.exec(migration);await db.exec(migration);
 const after=(await db.query("select pg_get_functiondef('public.guard_directory_provenance()'::regprocedure) as body,(select count(*)::int from pg_trigger where tgfoid='public.guard_directory_provenance()'::regprocedure) as attachments")).rows[0];
 assert.deepEqual(after,before);
 assert.equal((await db.query("select has_function_privilege('service_role','public.guard_directory_provenance()','EXECUTE') as allowed")).rows[0].allowed,true);
 assert.equal((await db.query("select has_function_privilege('anon','public.guard_directory_provenance()','EXECUTE') as allowed")).rows[0].allowed,false);
 assert.equal((await db.query("select has_function_privilege('authenticated','public.guard_directory_provenance()','EXECUTE') as allowed")).rows[0].allowed,false);
});
