import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {intakeDatabase,actor,OWNER,OTHER,ADMIN} from './intake-db-fixture.mjs';
const trip='41111111-1111-4111-8111-111111111111';
const day='41111111-1111-4111-8111-111111111112';
const person='41111111-1111-4111-8111-111111111113';
const second='41111111-1111-4111-8111-111111111114';
const sql=suffix=>readFileSync(new URL('../docs/sql/proposals/trip-personal-delete'+suffix+'.sql',import.meta.url),'utf8');
async function fixture(cutover=false){
 const db=await intakeDatabase();
 try{
  await db.query("insert into trips(id,owner_user_id,title) values($1,$2,'Synthetic deletion QA only')",[trip,OWNER]);
  await db.query('insert into trip_days(id,trip_id,day_number) values($1,$2,1)',[day,trip]);
  await db.exec(sql(''));if(cutover)await db.exec(sql('-cutover'));
  await actor(db,OWNER);return db;
 }catch(e){await db.close();throw e}
}
const revision=async db=>(await db.query('select plan_revision from trips where id=$1',[trip])).rows[0].plan_revision;
const remove=(db,v)=>db.query('select delete_personal_trip($1,$2)',[trip,v]);
const present=async db=>assert.equal((await db.query('select id from trips where id=$1',[trip])).rows.length,1);
const sharedError={code:'55006'};

test('delete proposal: personal RPC cascades owned days, rejects missing/stale revisions and cannot succeed twice',async()=>{
 const db=await fixture(true);try{
  const v=await revision(db);
  await assert.rejects(remove(db,null),{code:'40001'});
  await assert.rejects(remove(db,v-1),{code:'40001'});await present(db);
  await assert.rejects(db.query('delete from trips where id=$1',[trip]),{code:'42501'});
  assert.equal((await remove(db,v)).rows[0].delete_personal_trip,trip);
  await db.exec('reset role');assert.equal((await db.query('select id from trip_days where trip_id=$1',[trip])).rows.length,0);
  await actor(db,OWNER);await assert.rejects(remove(db,v),{code:'42501'});
 }finally{await db.close()}
});

test('delete proposal: editor, viewer, unrelated admin and anonymous cannot delete',async()=>{
 const db=await fixture();try{
  await db.exec('reset role');await db.query("insert into trip_members(trip_id,user_id,role) values($1,$2,'editor')",[trip,OTHER]);
  await actor(db,OWNER);const v=await revision(db);
  for(const role of ['editor','viewer']){
   await db.exec('reset role');await db.query('update trip_members set role=$1 where trip_id=$2',[role,trip]);
   await actor(db,OTHER);await assert.rejects(remove(db,v),{code:'42501'});
  }
  await actor(db,ADMIN);await assert.rejects(remove(db,v),{code:'42501'});
  await actor(db,null,'anon');await assert.rejects(remove(db,v),{code:'42501'});
  await actor(db,OWNER);await present(db);
 }finally{await db.close()}
});

test('delete proposal: share-token-only changes are blocked even without a plan revision change',async()=>{
 const db=await fixture();try{
  const v=await revision(db);await db.query('update trips set share_token=gen_random_uuid() where id=$1',[trip]);
  assert.equal(await revision(db),v);await assert.rejects(remove(db,v),sharedError);
  await assert.rejects(db.query('delete from trips where id=$1',[trip]),sharedError);await present(db);
 }finally{await db.close()}
});

test('delete proposal: new group data after captured itinerary revision blocks RPC and raw cascading delete',async()=>{
 const db=await fixture();try{
  const v=await revision(db);
  const seeds=[
   ["insert into trip_members(trip_id,user_id,role) values($1,$2,'viewer')",[trip,OTHER],'trip_members'],
   ["insert into trip_invites(trip_id,token_hash,role,expires_at,revoked_at) values($1,'synthetic','viewer',now()-interval '1 day',now())",[trip],'trip_invites'],
   ["insert into trip_people(id,trip_id,name) values($1,$2,'Synthetic participant')",[person,trip],'trip_people'],
   ["insert into trip_checklist(trip_id,title) values($1,'Synthetic checklist')",[trip],'trip_checklist'],
   ["insert into trip_polls(trip_id,title,options) values($1,'Synthetic poll','[\"A\",\"B\"]')",[trip],'trip_polls'],
   ["insert into trip_group_audit(trip_id,actor_id,action) values($1,$2,'synthetic')",[trip,OTHER],'trip_group_audit'],
   ["insert into trip_reservations(trip_id,owner_id,title,kind,notes) values($1,$2,'PRIVATE SYNTHETIC','stay','DO NOT DISCLOSE')",[trip,OTHER],'trip_reservations'],
  ];
  for(const [statement,args,table] of seeds){
   await db.exec('reset role');await db.query(statement,args);await actor(db,OWNER);
   assert.equal(await revision(db),v);
   await assert.rejects(remove(db,v),e=>e.code==='55006'&&!e.message.includes('PRIVATE')&&!e.message.includes('DO NOT DISCLOSE'));
   await assert.rejects(db.query('delete from trips where id=$1',[trip]),sharedError);await present(db);
   await db.exec('reset role');assert.equal((await db.query(`select count(*)::int as n from ${table} where trip_id=$1`,[trip])).rows[0].n,1);
   await db.query(`delete from ${table} where trip_id=$1`,[trip]);await actor(db,OWNER);
  }
  await remove(db,v);
 }finally{await db.close()}
});

test('delete proposal: money and nested votes remain intact after refused deletion',async()=>{
 const db=await fixture();try{
  const v=await revision(db);await db.exec('reset role');
  await db.query("insert into trip_people(id,trip_id,name) values($1,$3,'Synthetic A'),($2,$3,'Synthetic B')",[person,second,trip]);
  await db.query("insert into trip_expenses(trip_id,title,amount_satang,payer_id,shares,updated_by) values($1,'Synthetic expense',100,$2,'[]',$3)",[trip,person,OTHER]);
  await db.query('insert into trip_transfers(trip_id,from_id,to_id,amount_satang) values($1,$2,$3,100)',[trip,person,second]);
  const poll=(await db.query("insert into trip_polls(trip_id,title,options) values($1,'Synthetic poll','[\"A\",\"B\"]') returning id",[trip])).rows[0].id;
  await db.query('insert into trip_votes(poll_id,user_id,option_index) values($1,$2,0)',[poll,OTHER]);
  await actor(db,OWNER);await assert.rejects(remove(db,v),sharedError);await present(db);
  await db.exec('reset role');
  for(const table of ['trip_expenses','trip_transfers'])assert.equal((await db.query(`select count(*)::int as n from ${table} where trip_id=$1`,[trip])).rows[0].n,1);
  assert.equal((await db.query('select count(*)::int as n from trip_votes where poll_id=$1',[poll])).rows[0].n,1);
 }finally{await db.close()}
});

test('delete proposal: future direct child tables are not silently omitted from the guard',async()=>{
 const db=await fixture();try{
  const v=await revision(db);await db.exec('reset role');
  await db.exec('create table public.synthetic_future_trip_child(id uuid primary key default gen_random_uuid(),parent uuid references trips(id) on delete cascade)');
  await db.query('insert into synthetic_future_trip_child(parent) values($1)',[trip]);
  await actor(db,OWNER);await assert.rejects(remove(db,v),sharedError);await present(db);
 }finally{await db.close()}
});
