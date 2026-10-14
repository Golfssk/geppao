import {before,after,test} from 'node:test';
import assert from 'node:assert/strict';
import {fixtureDatabase,queryFixture} from './stays-db-fixture.mjs';
let db;
before(async()=>{db=await fixtureDatabase();await db.exec('set role anon');});
after(async()=>{await db.close();});
test('migration applies and public search is RLS-invoker, not SECURITY DEFINER',async()=>{
 const {rows}=await db.query("select prosecdef,proconfig from pg_proc where proname='search_public_stays'");assert.equal(rows[0].prosecdef,false);assert.ok(rows[0].proconfig.includes('search_path=public, pg_temp'));
});
test('anonymous search excludes drafts and returns fixed-size stable pages',async()=>{
 const a=await queryFixture(db),b=await queryFixture(db,{p_page:2});assert.equal(a.total,15);assert.equal(a.items.length,12);assert.equal(b.items.length,3);assert.equal(new Set([...a.items,...b.items].map(x=>x.id)).size,15);assert.ok(![...a.items,...b.items].some(x=>x.slug==='qa-stay-16'));
});
test('literal quotes, percent and SQL-looking text never expand a search',async()=>{
 for(const p_query of ["%","' or true --","x,publication_status.eq.pending"]){const r=await queryFixture(db,{p_query});assert.equal(r.total,0);}
});
test('budget and ordering compare THB/night only; null prices sort last',async()=>{
 const r=await queryFixture(db,{p_sort:'price_asc'});assert.equal(r.items[0].price,100);const p2=await queryFixture(db,{p_sort:'price_desc',p_page:2});assert.equal(p2.items.at(-1).price,null);const budget=await queryFixture(db,{p_max_price:250});assert.equal(budget.total,2);
});
test('unknown amenity/capacity never passes a requested hard filter',async()=>{
 const pet=await queryFixture(db,{p_pet:true});assert.equal(pet.total,5);assert.ok(pet.items.every(x=>x.pet_friendly===true));
 const capacity=await queryFixture(db,{p_guests:4});assert.equal(capacity.total,14);assert.ok(capacity.items.every(x=>x.maximum_guests>=4));assert.equal((await queryFixture(db,{p_guests:5})).total,0);
});
test('destination, verified filter and empty page retain accurate total',async()=>{
 assert.equal((await queryFixture(db,{p_destination:'not-a-destination'})).total,0);assert.equal((await queryFixture(db,{p_verified:true})).total,7);const r=await queryFixture(db,{p_page:500});assert.equal(r.total,15);assert.deepEqual(r.items,[]);
});
test('direct RPC rejects invalid numbers and unbounded inputs',async()=>{
 for(const args of [{p_page:0},{p_page:501},{p_guests:31},{p_max_price:-1},{p_max_price:'NaN'},{p_sort:'arbitrary'},{p_query:'a'.repeat(101)}])await assert.rejects(()=>queryFixture(db,args));
});
test('authenticated role does not gain private places through public RPC',async()=>{await db.exec('reset role; set role authenticated');const result=await queryFixture(db);assert.equal(result.total,15);assert.equal(result.items[0].image_url,null);await db.exec('reset role;set role anon');});
