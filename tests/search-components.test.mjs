import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {readFileSync} from 'node:fs';
import {sourceModule,jsonResponse} from './intake-route-fixture.mjs';
const stay=await sourceModule('lib/stays/query.ts');
const query=await sourceModule('lib/search/query.ts',{'../stays/query':stay});
const css=Object.fromEntries([...readFileSync(new URL('../components/search/UnifiedSearchClient.module.css',import.meta.url),'utf8').matchAll(/\.([a-zA-Z][\w-]*)/g)].map(x=>[x[1],x[1]]));
const row={id:'11111111-1111-4111-8111-111111111111',kind:'place',type:'accommodation',slug:'synthetic-stay',name:'Synthetic property',description:null,address:null,image_url:null,price:null,price_unit:null,currency:null,is_estimate:null,starts_at:null};
async function render(value='',error=null,total=1,locale='th'){
 const {UnifiedSearchClient}=await sourceModule('components/search/UnifiedSearchClient.tsx',{'@/components/trips/AddToTripButton':{AddToTripButton:()=>null},'next/link':{default:({children,...props})=>React.createElement('a',props,children),__esModule:true},'@/components/i18n/LocaleProvider':{useLocale:()=>({locale})},'@/lib/analytics/client':{trackProductEvent:async()=>{}},'@/components/analytics/EventInterestButton':{EventInterestButton:()=>null},'@/lib/search/query':query,'@/lib/stays/query':stay,'./UnifiedSearchClient.module.css':css});
 return renderToStaticMarkup(React.createElement(UnifiedSearchClient,{initialQuery:query.parseSearchQuery(new URLSearchParams(value),'2026-10-15'),initialResult:error?null:{items:total?[row]:[],total,page:1,pageSize:12},initialError:error,destinations:[],today:'2026-10-15'}));
}
test('one search form with all seven dropdown choices and no separate /stays CTA',async()=>{const html=await render();assert.equal((html.match(/<form/g)||[]).length,1);assert.match(html,/action="\/search"/);assert.match(html,/name="type"/);for(const type of query.SEARCH_TYPES)assert.match(html,new RegExp(`value="${type}"`));assert.doesNotMatch(html,/href="\/stays/);});
test('lodging fields are hidden and disabled outside accommodation',async()=>{const html=await render();assert.match(html,/<fieldset[^>]*class="lodging"[^>]*disabled=""[^>]*hidden=""/);});
test('accommodation filter opens lodging fields in the same search form',async()=>{const html=await render('type=accommodation&guests=4&capacity=1');assert.match(html,/<fieldset class="lodging">/);assert.match(html,/name="guests"[^>]*value="4"/);assert.match(html,/วันที่ใช้วางแผนเท่านั้น/);});
test('pagination and detail links retain category query and page',async()=>{const html=await render('type=accommodation&q=pool&page=2',null,30);assert.match(html,/\/search\?q=pool[^\"]*page=3[^\"]*type=accommodation/);assert.match(html,/\/places\/synthetic-stay\?q=pool[^\"]*page=2[^\"]*type=accommodation/);});
test('errors are alerts, not a misleading zero-results count',async()=>{const html=await render('','unavailable');assert.match(html,/role="alert"/);assert.doesNotMatch(html,/0 ผลลัพธ์/);});
test('empty and English states have clear messages without fake rates',async()=>{assert.match(await render('',null,0),/ยังไม่พบสถานที่/);const html=await render('lang=en',null,1,'en');assert.match(html,/Find your next good place/);assert.match(html,/Price not recorded/);assert.doesNotMatch(html,/0 THB/);});
test('server search wrapper sends bounded unified args and strips untrusted image origins',async()=>{
 let args;
 const {searchPublicCatalog}=await sourceModule('lib/search/server.ts',{'server-only':{},'@/lib/supabase/server':{createClient:async()=>({rpc:(name,input)=>{assert.equal(name,'search_public_catalog');args=input;return{abortSignal:async()=>({data:{items:[{...row,image_url:'https://external.invalid/photo.jpg'}],total:1},error:null})};}})},'@/lib/public-media':{managedPublicMediaUrl:()=>null},'@/lib/stays/query':stay,'./query':query});
 const r=await searchPublicCatalog(query.parseSearchQuery(new URLSearchParams('type=cafe')));assert.equal(args.p_type,'cafe');assert.equal(r.items[0].image_url,null);assert.equal(r.pageSize,12);
});
test('legacy stay route redirects through allowlisted unified URL',async()=>{const page=await sourceModule('app/stays/page.tsx',{'next/navigation':{redirect:href=>{throw new Error(href);}},'@/lib/search/query':query});await assert.rejects(()=>page.default({searchParams:Promise.resolve({q:'pool',lang:'en'})}),/\/search\?type=accommodation&q=pool&lang=en/);});
test('site navigation exposes one Search entry per navigation, with no separate Stays link',async()=>{
 const noop=()=>null;
 const {SiteChrome}=await sourceModule('components/navigation/SiteChrome.tsx',{'next/link':{default:({children,...props})=>React.createElement('a',props,children),__esModule:true},'next/navigation':{usePathname:()=>'/search'},'@/components/brand/Brand':{Brand:noop},'@/components/brand/Logo':{Logo:noop},'@/components/auth/UserNav':{UserNav:noop},'@/components/i18n/LanguageToggle':{LanguageToggle:noop},'@/components/i18n/LocaleProvider':{useLocale:()=>({locale:'en'})},'./SiteChrome.module.css':{}});
 const html=renderToStaticMarkup(React.createElement(SiteChrome,{name:'Synthetic',email:null,isAdmin:false},'test'));
 for(const label of ['Primary navigation']){const navigation=html.match(new RegExp(`<nav[^>]*aria-label="${label}"[^>]*>(.*?)</nav>`))[1];assert.equal((navigation.match(/href="\/search"/g)||[]).length,1);assert.doesNotMatch(navigation,/href="\/stays"/);assert.match(navigation,/Search/);assert.doesNotMatch(navigation,/href="\/stories"/);}
 assert.equal((html.match(/aria-label="Primary navigation"/g)||[]).length,1);
});
