import test from 'node:test';import assert from 'node:assert/strict';
import {sourceModule} from './intake-route-fixture.mjs';
function request(values=[]){const jar=new Map(values.map(v=>[v.name,v.value]));const headers=new Headers();const update=()=>headers.set('cookie',[...jar].map(([k,v])=>k+'='+v).join('; '));update();return{headers,cookies:{getAll:()=>[...jar].map(([name,value])=>({name,value})),set(name,value){jar.set(name,value);update()}}}}
async function fixture(getUser,env={NEXT_PUBLIC_SUPABASE_URL:'https://example.supabase.co',NEXT_PUBLIC_SUPABASE_ANON_KEY:'synthetic-anon'}){
 let creations=0,options;const responses=[];
 const mod=await sourceModule('lib/supabase/proxy.ts',{'@supabase/ssr':{createServerClient(_url,_key,o){creations++;options=o;return{auth:{getUser:()=>getUser(o)}}}},'next/server':{NextResponse:{next(init){const result={forwarded:init.request.headers,headers:new Headers(),written:[],cookies:{set(...args){result.written.push(args)}}};responses.push(result);return result}}}},{Headers,process:{env}});
 return{...mod,responses,created:()=>creations,options:()=>options};
}
test('SSR auth refresh: anonymous or code-verifier-only requests never call provider',async()=>{
 const f=await fixture(()=>{throw new Error('must not call')});
 for(const names of [[],[{name:'geppao-locale',value:'en'}],[{name:'sb-example-auth-token-code-verifier',value:'synthetic'}]]){
  const r=request(names),h=new Headers(r.headers);h.set('x-geppao-locale','en');const response=await f.refreshAuthSession(r,h);
  assert.equal(response.forwarded.get('x-geppao-locale'),'en');assert.equal(response.written.length,0);
 }assert.equal(f.created(),0);
});
test('SSR auth refresh: chunk rotation/deletion reaches downstream request and browser with cookie options intact',async()=>{
 const f=await fixture(async o=>{o.cookies.setAll([{name:'sb-example-auth-token.0',value:'synthetic-fresh',options:{path:'/',sameSite:'lax',secure:true}},{name:'sb-example-auth-token.1',value:'',options:{path:'/',maxAge:0}}]);return{data:{user:{id:'synthetic'}},error:null}});
 const r=request([{name:'sb-example-auth-token.0',value:'synthetic-old'},{name:'sb-example-auth-token.1',value:'synthetic-old-2'}]);const h=new Headers(r.headers);h.set('x-geppao-locale','th');
 const response=await f.refreshAuthSession(r,h);assert.equal(f.created(),1);assert.equal(response.written.length,2);assert.equal(response.written[1][2].maxAge,0);assert.equal(response.written[0][2].secure,true);assert.match(response.forwarded.get('cookie'),/synthetic-fresh/);assert.doesNotMatch(response.forwarded.get('cookie'),/synthetic-old/);assert.equal(response.forwarded.get('x-geppao-locale'),'th');assert.equal(response.headers.get('Cache-Control'),'private, no-store');
});
test('SSR auth refresh: thrown outage neither logs out nor manufactures identity or auth redirect',async()=>{
 const f=await fixture(async()=>{throw new Error('PRIVATE PROVIDER DETAIL')});const r=request([{name:'sb-example-auth-token',value:'synthetic-existing'}]);const response=await f.refreshAuthSession(r,new Headers(r.headers));assert.equal(response.written.length,0);assert.match(response.forwarded.get('cookie'),/synthetic-existing/);assert.equal(response.headers.get('location'),null);assert.equal(response.headers.get('Cache-Control'),'private, no-store');assert.equal(response.forwarded.get('x-user-id'),null);
});
test('SSR auth refresh: expired-session cookie removal from provider is propagated, not guessed',async()=>{
 const f=await fixture(async o=>{o.cookies.setAll([{name:'sb-example-auth-token',value:'',options:{maxAge:0,path:'/'}}]);return{data:{user:null},error:{message:'expired'}}});const r=request([{name:'sb-example-auth-token',value:'synthetic-expired'}]);const response=await f.refreshAuthSession(r,new Headers(r.headers));assert.equal(response.written.length,1);assert.equal(response.written[0][2].maxAge,0);assert.doesNotMatch(response.forwarded.get('cookie'),/synthetic-expired/);
});
test('SSR auth refresh: missing local configuration does not invent a session',async()=>{
 const f=await fixture(()=>{throw new Error('must not call')},{});const r=request([{name:'sb-example-auth-token',value:'synthetic'}]);const response=await f.refreshAuthSession(r,new Headers(r.headers));assert.equal(f.created(),0);assert.equal(response.written.length,0);assert.match(response.headers.get('Cache-Control'),/no-store/);
});
