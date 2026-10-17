import test from 'node:test';
import assert from 'node:assert/strict';
import {safeAuthNext} from '../lib/auth/redirect.ts';
import {sourceModule} from './intake-route-fixture.mjs';
const helper={'@/lib/auth/redirect':{safeAuthNext}};
const response={NextResponse:{redirect:(url,init)=>new Response(null,{...init,headers:{...init.headers,Location:String(url)}})}};
test('auth destination: preserves internal navigation but rejects authority, control, encoding and loop tricks',()=>{
 for(const value of [undefined,null,[],42,'','https://evil.invalid','//evil.invalid','/\\evil.invalid','/%5cevil.invalid','/%255cevil.invalid','/%2f%2fevil.invalid','/%252f%252fevil.invalid','/\tevil.invalid','/trips%0d%0aX:test','/trips%ZZ','/login','/host/login?next=/trips','/auth/callback?code=secret','/safe/../host/login','/%61uth/callback','/'+ 'a'.repeat(2048)])assert.equal(safeAuthNext(value),'/trips',String(value));
 for(const value of ['/planner?lang=en','/trips/123?tab=money#day-2','/business/places','/trips?next=https%3A%2F%2Fexample.invalid'])assert.equal(safeAuthNext(value),value);
});
async function callback(exchange){return (await sourceModule('app/auth/callback/route.ts',{...helper,'next/server':response,'@/lib/supabase/server':{createClient:async()=>({auth:{exchangeCodeForSession:exchange}})}})).GET}
test('auth callback: exchanges once and redirects only internally with private no-store headers',async()=>{
 let calls=0;const GET=await callback(async code=>{calls++;assert.equal(code,'synthetic-code');return{error:null}});
 const r=await GET(new Request('https://example.test/auth/callback?code=synthetic-code&next=%2F%5Cevil.invalid'));
 assert.equal(calls,1);assert.equal(r.status,303);assert.equal(r.headers.get('location'),'https://example.test/trips');assert.match(r.headers.get('cache-control'),/private, no-store/);assert.equal(r.headers.get('referrer-policy'),'no-referrer');
});
test('auth callback: missing, duplicate or provider-denied codes do not exchange or leak provider details',async()=>{
 let calls=0;const GET=await callback(async()=>{calls++;return{error:null}});
 for(const query of ['', '?code=a&code=b','?code=a&error=access_denied&error_description=PRIVATE']){
  const r=await GET(new Request('https://example.test/auth/callback'+query));const u=new URL(r.headers.get('location'));
  assert.equal(u.pathname,'/host/login');assert.equal(u.searchParams.get('error'),'oauth');assert.doesNotMatch(u.toString(),/PRIVATE|code=/);assert.match(r.headers.get('cache-control'),/no-store/);
 }assert.equal(calls,0);
});
test('auth callback: rejection and thrown network failures return to localized retry screen',async()=>{
 for(const exchange of [async()=>({error:{message:'PRIVATE'}}),async()=>{throw new Error('PRIVATE')}]){
  const GET=await callback(exchange);const r=await GET(new Request('https://example.test/auth/callback?code=synthetic&next=%2Fplanner%3Flang%3Den&lang=en'));
  const u=new URL(r.headers.get('location'));assert.equal(u.pathname,'/host/login');assert.equal(u.searchParams.get('next'),'/planner?lang=en');assert.equal(u.searchParams.get('lang'),'en');assert.doesNotMatch(u.toString(),/PRIVATE|synthetic/);
 }
});
test('legacy login alias retains safe next and valid locale instead of dropping the return path',async()=>{
 const {default:Login}=await sourceModule('app/login/page.tsx',{...helper,'next/navigation':{redirect:url=>{throw new Error(url)}}});
 await assert.rejects(Login({searchParams:Promise.resolve({next:'/planner?lang=en',lang:'en'})}),/\/host\/login\?next=%2Fplanner%3Flang%3Den&lang=en/);
 await assert.rejects(Login({searchParams:Promise.resolve({next:'//evil.invalid',lang:'invalid'})}),e=>e.message==='/host/login?next=%2Ftrips');
});
