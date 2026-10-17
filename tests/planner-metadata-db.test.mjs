import test from 'node:test';import assert from 'node:assert/strict';
import {intakeDatabase,actor,OWNER,OTHER} from './intake-db-fixture.mjs';
const id='39111111-1111-4111-8111-111111111111',day='39111111-1111-4111-8111-111111111112';
const revision=async db=>(await db.query('select plan_revision from trips where id=$1',[id])).rows[0].plan_revision;
test('actual migration chain: conditional metadata edits and deletes reject stale revisions and cascade atomically',async()=>{
 const db=await intakeDatabase();try{
 await db.query("insert into trips(id,owner_user_id,title,travelers) values($1,$2,'Synthetic metadata QA',2)",[id,OWNER]);await db.query('insert into trip_days(id,trip_id,day_number) values($1,$2,1)',[day,id]);await db.query("insert into trip_members(trip_id,user_id,role) values($1,$2,'editor')",[id,OTHER]);
 await actor(db,OWNER);const old=await revision(db);
 const first=await db.query("update trips set title='Fresh' where id=$1 and owner_user_id=$2 and plan_revision=$3 returning id",[id,OWNER,old]);assert.equal(first.rows.length,1);assert.ok(await revision(db)>old);
 assert.equal((await db.query("update trips set title='STALE' where id=$1 and owner_user_id=$2 and plan_revision=$3 returning id",[id,OWNER,old])).rows.length,0);
 assert.equal((await db.query('delete from trips where id=$1 and owner_user_id=$2 and plan_revision=$3 returning id',[id,OWNER,old])).rows.length,0);
 const before=await revision(db);await db.query('update trips set travelers=3 where id=$1 and owner_user_id=$2 and plan_revision=$3',[id,OWNER,before]);assert.ok(await revision(db)>before);
 await actor(db,OTHER);assert.equal((await db.query('delete from trips where id=$1 and owner_user_id=$2 and plan_revision=$3 returning id',[id,OTHER,await revision(db)])).rows.length,0);
 await actor(db,OWNER);const latest=await revision(db);assert.equal((await db.query('delete from trips where id=$1 and owner_user_id=$2 and plan_revision=$3 returning id',[id,OWNER,latest])).rows.length,1);
 assert.equal((await db.query('select id from trip_days where trip_id=$1',[id])).rows.length,0);assert.equal((await db.query('delete from trips where id=$1 and owner_user_id=$2 and plan_revision=$3 returning id',[id,OWNER,latest])).rows.length,0);
 }finally{await db.close()}
});
