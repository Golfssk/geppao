import test from 'node:test';import assert from 'node:assert/strict';
import {sourceModule,jsonResponse} from './intake-route-fixture.mjs';
import {tripMetadata} from '../lib/trips/metadata.ts';
const id='39111111-1111-4111-8111-111111111111',uid='39111111-1111-4111-8111-111111111112';
async function fixture(opts={}){
 const calls=[];let writes=0;
 const s={auth:{getUser:async()=>({data:{user:opts.anonymous?null:{id:uid}}})},from(table){const filters=[];let write=false;const q={select(){return q},eq(k,v){filters.push([k,v]);return q},update(p){write=true;calls.push({patch:p,filters});return q},delete(){write=true;calls.push({remove:true,filters});return q},async maybeSingle(){assert.equal(table,'trips');if(opts.thrown)throw new Error('PRIVATE SQL');if(!write)return {data:opts.foreign?null:{id},error:opts.readError?{message:'PRIVATE SQL'}:null};writes++;return{data:opts.stale?null:{id},error:opts.writeError?{message:'PRIVATE SQL'}:null}}};return q}};
 const helper=await sourceModule('lib/trips/mutation.ts',{'next/server':jsonResponse,'@/lib/supabase/server':{createClient:async()=>s}});
 const route=await sourceModule('app/api/trips/[id]/route.ts',{'next/server':jsonResponse,'@/lib/trips/mutation':helper,'@/lib/trips/metadata':{tripMetadata}});
 return {calls,get writes(){return writes},async send(body={expectedVersion:5,title:'New trip'},method='PATCH',headers={},tripId=id){return route[method](new Request('https://local.test/api/trips/'+tripId,{method,headers,body:typeof body==='string'?body:JSON.stringify(body)}),{params:Promise.resolve({id:tripId})})}};
}
test('metadata allows only bounded explicit fields',()=>{
 assert.deepEqual(tripMetadata({expectedVersion:1,title:'  Trip  ',status:'active',travelers:4,budgetTotal:null}),{title:'Trip',status:'active',travelers:4,budget_total:null});
 for(const body of [{title:' '},{title:'x'.repeat(161)},{travelers:0},{travelers:1.5},{travelers:101},{travelers:'2'},{budgetTotal:-1},{budgetTotal:Infinity},{budgetTotal:0.001},{budgetTotal:0.00000001},{status:'published'},{owner_user_id:uid},{start_date:'2030-01-01'},{}])assert.equal(tripMetadata(body),null);
 assert.deepEqual(tripMetadata({budgetTotal:12.34}),{budget_total:12.34});
});
test('PATCH and DELETE bind owner and expected revision on the write itself',async()=>{
 for(const method of ['PATCH','DELETE']){const f=await fixture();const r=await f.send(method==='PATCH'?{expectedVersion:5,title:' Name '}:{expectedVersion:5},method);assert.equal(r.status,200);assert.equal(r.headers.get('Cache-Control'),'no-store');assert.equal((await r.json()).success,true);assert.equal(f.writes,1);assert.deepEqual(f.calls[0].filters,[['id',id],['owner_user_id',uid],['plan_revision',5]]);if(method==='PATCH')assert.equal(f.calls[0].patch.title,'Name')}
});
test('stale or already removed rows never report successful writes',async()=>{
 for(const method of ['PATCH','DELETE']){const f=await fixture({stale:true});assert.equal((await f.send(method==='PATCH'?{expectedVersion:1,title:'x'}:{expectedVersion:1},method)).status,409)}
});
test('request guard rejects anonymous, foreign, cross-site, malformed and unversioned requests',async()=>{
 for(const [opts,body,headers,tripId,status]of [[{anonymous:true},{expectedVersion:1,title:'x'},{},id,401],[{foreign:true},{expectedVersion:1,title:'x'},{},id,404],[{},{expectedVersion:1,title:'x'},{origin:'https://evil.test'},id,403],[{},{expectedVersion:1,title:'x'},{'sec-fetch-site':'cross-site'},id,403],[{},'oops',{},id,400],[{},[],{},id,400],[{},{title:'x'},{},id,428],[{},{expectedVersion:'1',title:'x'},{},id,428],[{},{expectedVersion:0,title:'x'},{},id,428],[{},{expectedVersion:1,title:'x'},{},'bad',404],[{},{expectedVersion:1,title:'x'},{'content-length':'13000'},id,413]]){const f=await fixture(opts);assert.equal((await f.send(body,'PATCH',headers,tripId)).status,status);assert.equal(f.writes,0)}
});
test('validation rejects unsupported metadata and delete payloads without writes',async()=>{for(const [method,body]of [['PATCH',{expectedVersion:1,title:'x',owner_user_id:uid}],['PATCH',{expectedVersion:1}],['DELETE',{expectedVersion:1,title:'x'}]]){const f=await fixture();assert.equal((await f.send(body,method)).status,400);assert.equal(f.writes,0)}});
test('database errors are sanitized and unavailable is not a success',async()=>{for(const opts of [{readError:true},{writeError:true},{thrown:true}]){const f=await fixture(opts);const r=await f.send();assert.equal(r.status,503);assert.doesNotMatch(await r.text(),/PRIVATE SQL/)}});
