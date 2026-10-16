import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {sourceModule,jsonResponse,candidateId,placeId,dbFixture} from './intake-route-fixture.mjs';
const {acceptImportRequest}=await sourceModule('lib/intake/contracts.ts');
async function routeFixture({user={id:'admin'},admin=true,rpcError=null}={}) {
  const calls=[];
  const supabase={rpc:async(name,args)=>{calls.push({name,args});return{data:{place_id:placeId},error:rpcError};}};
  const route=await sourceModule('app/api/admin/imports/[id]/route.ts', {'next/server':jsonResponse,'@/lib/admin-access':{getAdminContext:async()=>({user,admin,supabase})}});
  return {calls,route,post:body=>route.POST(new Request('https://test.invalid',{method:'POST',body:JSON.stringify(body)}),{params:Promise.resolve({id:candidateId})})};
}
for(const [label,existing] of [['new',null],['link',placeId]]) test(`actual UI contract: ${label} accepts nullable reason`,async()=>{
  const fixture=await routeFixture();
  const result=await fixture.post(acceptImportRequest(existing));
  assert.equal(result.status,200);
  assert.equal(fixture.calls.length,1);
  assert.equal(fixture.calls[0].args.existing_place_id,existing);
  assert.equal(fixture.calls[0].args.distinct_reason,null);
});
for(const reason of [undefined,null,'   ']) test(`ordinary accept normalizes ${String(reason)}`,async()=>{
  const f=await routeFixture();assert.equal((await f.post({action:'accept',distinct_reason:reason})).status,200);assert.equal(f.calls[0].args.distinct_reason,null);
});
for(const reason of [true,123,[],{},'x'.repeat(2001)]) test(`rejects invalid reason ${typeof reason}/${String(reason).length}`,async()=>{
  const f=await routeFixture();assert.equal((await f.post({action:'accept',distinct_reason:reason})).status,400);assert.equal(f.calls.length,0);
});
for(const reason of [null,'short','   ']) test(`distinct override cannot bypass meaningful reason: ${reason}`,async()=>{
  const f=await routeFixture();assert.equal((await f.post(acceptImportRequest(null,[placeId],reason))).status,400);assert.equal(f.calls.length,0);
});
test('distinct override retains reviewed ids and trimmed justification',async()=>{
  const f=await routeFixture();assert.equal((await f.post(acceptImportRequest(null,[placeId],'  Separate buildings verified by owner  '))).status,200);assert.deepEqual([...f.calls[0].args.reviewed_distinct_ids],[placeId]);assert.equal(f.calls[0].args.distinct_reason,'Separate buildings verified by owner');
});
for(const body of [[],null,{action:'other'},{action:'accept',existing_place_id:123},{action:'accept',reviewed_distinct_ids:[false]},{action:'accept',reviewed_distinct_ids:placeId}]) test(`invalid accept payload ${JSON.stringify(body)}`,async()=>{
  const f=await routeFixture();assert.equal((await f.post(body)).status,400);assert.equal(f.calls.length,0);
});
for(const [user,admin,status] of [[null,false,401],[{id:'owner'},false,403]]) test(`import GET/POST auth rejects ${status} before database`,async()=>{
  const f=await routeFixture({user,admin});assert.equal((await f.post(acceptImportRequest())).status,status);assert.equal((await f.route.GET(new Request('https://test.invalid'),{params:Promise.resolve({id:candidateId})})).status,status);assert.equal(f.calls.length,0);
});
test('database duplicate conflict remains HTTP 409',async()=>{const f=await routeFixture({rpcError:{code:'23505',message:'duplicate'}});assert.equal((await f.post(acceptImportRequest())).status,409);});

const curation=await sourceModule('lib/admin/curation.ts');
const navigation={redirect:path=>{throw new Error('redirect:'+path);},notFound:()=>{throw new Error('not-found');},useRouter:()=>({refresh(){}})};
async function pageFixture(row,{user={id:'admin'},admin=true,error=null}={}){
  const supabase=dbFixture(row,error);
  const page=await sourceModule('app/admin/places/[id]/curate/page.tsx',{'next/navigation':navigation,'@/lib/admin-access':{getAdminContext:async()=>({user,admin,supabase})},'@/lib/admin/curation':curation,'@/components/admin/AdminPlaceCuration':{AdminPlaceCuration:()=>null}});
  return{db:supabase,run:()=>page.default({params:Promise.resolve({id:placeId})})};
}
for(const business_id of [null,'business-owned']) test(`admin curation loads ${business_id??'unclaimed'} place`,async()=>{
  const row={id:placeId,business_id};const f=await pageFixture(row);assert.equal((await f.run()).props.place,row);assert.ok(f.db.calls.find(([op,value])=>op==='select'&&value.includes('business_id')));
});
test('absent place remains 404',async()=>{const f=await pageFixture(null);await assert.rejects(f.run,/not-found/);});
test('query failure is not mislabeled 404',async()=>{const f=await pageFixture(null,{error:{message:'unavailable'}});await assert.rejects(f.run,/Admin review/);});
for(const [user,admin,path] of [[null,false,'/host/login'],[{id:'owner'},false,'/']]) test(`curation access redirects ${path} before query`,async()=>{const f=await pageFixture({id:placeId},{user,admin});await assert.rejects(f.run,new RegExp('redirect:'+path));assert.equal(f.db.calls.length,0);});
const {AdminPlaceCuration}=await sourceModule('components/admin/AdminPlaceCuration.tsx',{'next/navigation':navigation});
function markup(business_id,adminImage=false){return renderToStaticMarkup(React.createElement(AdminPlaceCuration,{place:{id:placeId,business_id,name:'Synthetic test property',place_type:'accommodation',place_hours:[],price_items:[],place_sources:[],accommodation_details:null,place_images:[{id:candidateId,image_url:`https://test.invalid/storage/v1/object/public/place-images/${adminImage?'admin/'+placeId:'owner/path'}/sample.webp`,approved_for_public:false,sort_order:0,is_cover:false,takedown_status:'active'}]}}));}
test('owned profile/hours/prices/details disabled but media approval remains enabled',()=>{
  const html=markup('owned');assert.equal((html.match(/<fieldset disabled=""/g)||[]).length,4);
  const media=html.split('</fieldset>').at(-1);assert.match(media,/อนุมัติแสดง/);assert.doesNotMatch(media,/<fieldset|<button[^>]*disabled|>ลบ<\/button>/);assert.match(html,/Business workspace/);
});
test('unclaimed content stays editable; admin-upload deletion stays available',()=>{const html=markup(null,true);assert.equal((html.match(/data-owner-content="true"/g)||[]).length,4);assert.doesNotMatch(html,/<fieldset disabled/);assert.match(html.split('</fieldset>').at(-1),/>ลบ<\/button>/);});
// The read-side fix must not broaden existing owner-content mutation rights.
for(const [endpoint,body] of [
  ['curation',{description:'Synthetic edit',priceDataStatus:'unknown'}],
  ['hours',{items:[{dayOfWeek:1,isClosed:true,crossesMidnight:false}]}],
  ['prices',{items:[{label:'Synthetic reference price',amountMin:100,unit:'night'}]}],
]) test(`owned place still rejects Admin ${endpoint} mutation`,async()=>{
  const row={id:placeId,business_id:'owner-business'};
  const db=dbFixture(row);let rpcCalls=0,updates=0;
  const originalFrom=db.from.bind(db);
  db.from=name=>{const q=originalFrom(name);q.update=()=>{const read=q.maybeSingle.bind(q);q.maybeSingle=async()=>{const result=await read();if(result.data)updates++;return result;};return q;};return q;};
  db.rpc=async()=>{rpcCalls++;updates++;return{data:null,error:null};};
  const validation=await sourceModule('lib/intake/validation.ts');
  const route=await sourceModule(`app/api/admin/places/[id]/${endpoint}/route.ts`,{'next/server':jsonResponse,'@/lib/admin-access':{getAdminContext:async()=>({user:{id:'admin'},admin:true,supabase:db})},'@/lib/intake/validation':validation});
  const result=await route.PUT(new Request('https://test.invalid',{method:'PUT',body:JSON.stringify(body)}),{params:Promise.resolve({id:placeId})});
  assert.equal(result.status,404);assert.equal(rpcCalls,0);assert.equal(updates,0);
});
