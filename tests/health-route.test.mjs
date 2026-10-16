import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import {loadBindings, transform} from 'next/dist/build/swc/index.js';
import {createHealthCheck} from '../lib/health/status.ts';
await loadBindings();
const source = await fs.readFile(new URL('../app/api/health/route.ts',import.meta.url),'utf8');
const {code} = await transform(source,{filename:'route.ts',jsc:{parser:{syntax:'typescript'}},module:{type:'commonjs'}});
function route({configured=true,fail=false,throws=false}={}) {
 const calls=[];let options;
 const module={exports:{}};
 const createClient=(url,key,config)=>{
  options={url,key,config};if(throws)throw Error('private connection details');
  return {from(table){calls.push(['from',table]);const query={select(...args){calls.push(['select',...args]);return this;},eq(...args){calls.push(['eq',...args]);return this;},limit(n){calls.push(['limit',n]);return this;},abortSignal(signal){calls.push(['signal',signal]);return Promise.resolve({error:fail?{message:'private SQL details'}:null,data:null});}};return query;}};
 };
 const mocks={'next/server':{NextResponse:{json:(body,options)=>Response.json(body,options)}},'@supabase/supabase-js':{createClient},'@/lib/health/status':{createHealthCheck}};
 vm.runInNewContext(code,{module,exports:module.exports,require:n=>mocks[n],process:{env:configured?{NEXT_PUBLIC_SUPABASE_URL:'https://public.example',NEXT_PUBLIC_SUPABASE_ANON_KEY:'public-anon-key'}:{}}});
 return {GET:module.exports.GET,calls,getOptions:()=>options};
}
test('route returns 200 for reachable empty tables using cookie-free public client',async()=>{
 const r=route();const response=await r.GET();assert.equal(response.status,200);assert.deepEqual(await response.json(),{status:'ok',checks:{environment:true,database:true}});
 assert.deepEqual(r.calls.filter(x=>x[0]==='from').map(x=>x[1]),['destinations','places','events']);assert.equal(r.calls.filter(x=>x[0]==='limit'&&x[1]===1).length,3);
 assert.deepEqual(JSON.parse(JSON.stringify(r.getOptions().config)),{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});assert.equal(response.headers.get('Cache-Control'),'private, no-store');assert.equal(response.headers.get('X-Robots-Tag'),'noindex, nofollow');
 assert.equal(r.calls.filter(x=>x[0]==='signal'&&x[1].aborted).length,3);
});
test('route returns generic 503 on any database query error',async()=>{
 const response=await route({fail:true}).GET();assert.equal(response.status,503);const body=await response.text();assert.match(body,/DEPENDENCY_UNAVAILABLE/);assert.doesNotMatch(body,/private|SQL|counts|errors/);
});
test('route returns generic 503 if client setup throws',async()=>{
 const response=await route({throws:true}).GET();assert.equal(response.status,503);assert.doesNotMatch(await response.text(),/private|connection/);
});
test('route reports missing config without constructing a client',async()=>{
 const r=route({configured:false});const response=await r.GET();assert.equal(response.status,503);assert.equal((await response.json()).code,'NOT_CONFIGURED');assert.equal(r.getOptions(),undefined);
});
