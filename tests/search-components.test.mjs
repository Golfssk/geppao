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
async function render(value='',error=null,total=1,locale='th',items=null){
 const pickerCss=Object.fromEntries([...readFileSync(new URL('../components/search/PlaceCategoryPicker.module.css',import.meta.url),'utf8').matchAll(/\.([a-zA-Z][\w-]*)/g)].map(x=>[x[1],x[1]]));
 const picker=await sourceModule('components/search/PlaceCategoryPicker.tsx',{'@/components/i18n/LocaleProvider':{useLocale:()=>({locale})},'./PlaceCategoryPicker.module.css':pickerCss});
 const {UnifiedSearchClient}=await sourceModule('components/search/UnifiedSearchClient.tsx',{'./PlaceCategoryPicker':picker,'@/components/trips/AddToTripButton':{AddToTripButton:()=>React.createElement('button',{className:'btn trip-add-button'},'Add to trip')},'next/link':{default:({children,...props})=>React.createElement('a',props,children),__esModule:true},'@/components/i18n/LocaleProvider':{useLocale:()=>({locale})},'@/lib/analytics/client':{trackProductEvent:async()=>{}},'@/components/analytics/EventInterestButton':{EventInterestButton:()=>null},'@/lib/search/query':query,'@/lib/stays/query':stay,'./UnifiedSearchClient.module.css':css});
 return renderToStaticMarkup(React.createElement(UnifiedSearchClient,{initialQuery:query.parseSearchQuery(new URLSearchParams(value),'2026-10-15'),initialResult:error?null:{items:items??(total?[row]:[]),total,page:1,pageSize:12},initialError:error,destinations:[],today:'2026-10-15'}));
}
test('one search form with all seven icon radio choices and no separate /stays CTA',async()=>{const html=await render();assert.equal((html.match(/<form/g)||[]).length,1);assert.match(html,/action="\/search"/);assert.match(html,/name="type"/);assert.equal((html.match(/type="radio"/g)||[]).length,7);assert.equal((html.match(/checked=""/g)||[]).length,1);assert.doesNotMatch(html,/<select[^>]*name="type"/);assert.match(html,/<legend[^>]*>ประเภทสถานที่/);for(const type of query.SEARCH_TYPES)assert.match(html,new RegExp(`value="${type}"`));assert.doesNotMatch(html,/href="\/stays/);});
test('category radios retain the submitted selection and use discovery order',async()=>{
 const html=await render('type=cafe');const radios=[...html.matchAll(/<input[^>]*type="radio"[^>]*>/g)].map(m=>m[0]);
 assert.deepEqual(radios.map(r=>r.match(/value="([^"]+)"/)[1]),['all','accommodation','restaurant','cafe','attraction','activity','event']);
 assert.equal(radios.filter(r=>r.includes('checked=""')).length,1);assert.match(radios.find(r=>r.includes('checked=""')),/value="cafe"/);
 assert.equal((html.match(/<svg[^>]*focusable="false"/g)||[]).length,7);assert.doesNotMatch(html,/role="tab"/);
});
test('English category buttons and accommodation planning fields are discoverable',async()=>{
 const html=await render('type=accommodation&lang=en',null,1,'en');
 assert.match(html,/<legend[^>]*>Place category/);for(const label of ['Everything','Stays','Restaurants','Cafes','Attractions','Activities','Events'])assert.ok(html.includes(label));
 assert.match(html,/<details[^>]*open=""/);assert.match(html,/Swipe to see more categories/);
});
test('lodging fields are hidden and disabled outside accommodation',async()=>{const html=await render();assert.match(html,/<fieldset[^>]*class="lodging"[^>]*disabled=""[^>]*hidden=""/);});
test('accommodation filter opens lodging fields in the same search form',async()=>{const html=await render('type=accommodation&guests=4&capacity=1');assert.match(html,/<fieldset class="lodging">/);assert.match(html,/name="guests"[^>]*value="4"/);assert.match(html,/วันที่ใช้วางแผนเท่านั้น/);});
test('pagination and detail links retain category query and page',async()=>{const html=await render('type=accommodation&q=pool&page=2',null,30);assert.match(html,/\/search\?q=pool[^\"]*page=3[^\"]*type=accommodation/);assert.match(html,/\/places\/synthetic-stay\?q=pool[^\"]*page=2[^\"]*type=accommodation/);});
test('errors are alerts, not a misleading zero-results count',async()=>{const html=await render('','unavailable');assert.match(html,/role="alert"/);assert.doesNotMatch(html,/0 ผลลัพธ์/);});
test('empty and English states have clear messages without fake rates',async()=>{assert.match(await render('',null,0),/ยังไม่พบสถานที่/);const html=await render('lang=en',null,1,'en');assert.match(html,/Find your next good place/);assert.match(html,/Price not recorded/);assert.doesNotMatch(html,/0 THB/);});
test('each result category uses its own labelled generic illustration only when no real photo exists',async()=>{
 const types=query.SEARCH_TYPES.filter(t=>t!=='all');
 const items=types.map((type,i)=>({...row,id:`synthetic-${i}`,type,kind:type==='event'?'event':'place'}));
 const html=await render('',null,6,'th',items);
 for(const type of types){assert.match(html,new RegExp(`src="/illustrations/search/${type}\\.svg"`));assert.ok(html.includes(`data-place-type="${type}"`));}
 assert.equal((html.match(/class="mockupBadge"/g)||[]).length,6);assert.equal((html.match(/ไม่ใช่ภาพสถานที่จริง/g)||[]).length,12);
 const en=await render('lang=en',null,1,'en');assert.match(en,/Illustration · not a venue photo/);assert.match(en,/not a photo of this place/);
});
test('an approved real photo wins over mockup art and does not show a mockup badge',async()=>{
 const html=await render('',null,1,'th',[{...row,image_url:'https://images.example.test/approved.jpg',image_alt:'Approved real photo'}]);
 assert.match(html,/src="https:\/\/images\.example\.test\/approved.jpg" alt="Approved real photo"/);
 assert.doesNotMatch(html,/class="mockupBadge"|src="\/illustrations\/search\//);
});
test('detail and add-to-trip actions share a footer with a separate right-hand add wrapper',async()=>{
 const html=await render();assert.match(html,/<div class="cardActions"><a class="detail"[^>]*>[\s\S]*?<div class="addAction"><button class="btn trip-add-button">Add to trip<\/button><\/div><\/div>/);
 const style=readFileSync(new URL('../components/search/UnifiedSearchClient.module.css',import.meta.url),'utf8');
 assert.match(style,/\.addAction\{[^}]*margin-left:auto/);assert.match(style,/\.body h3\{color:#ad481f/);assert.match(style,/\.detail\{background:#ad481f;color:#fff/);
});
test('category mockup assets are original static SVGs without remote references or active content',()=>{
 for(const type of query.SEARCH_TYPES.filter(t=>t!=='all')){
  const svg=readFileSync(new URL(`../public/illustrations/search/${type}.svg`,import.meta.url),'utf8');
  assert.match(svg,/<svg[^>]*viewBox="0 0 640 360"/);assert.match(svg,/Not an image of any listed venue or event/);
  assert.doesNotMatch(svg,/<script|<foreignObject|<image|\son\w+=|(?:href|src)=|<!ENTITY/i);
 }
});
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
test('category tags stay distinct and all tag/action text meets normal-text contrast',()=>{
 const style=readFileSync(new URL('../components/search/UnifiedSearchClient.module.css',import.meta.url),'utf8');
 const luminance=hex=>{const c=hex.replace('#','').match(/../g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return c[0]*.2126+c[1]*.7152+c[2]*.0722;};
 const contrast=(a,b)=>{const x=luminance(a),y=luminance(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
 const backgrounds=[];
 for(const type of query.SEARCH_TYPES.filter(t=>t!=='all')){
  const rule=style.match(new RegExp(`\\.kind\\[data-place-type=${type}\\]\\{([^}]+)\\}`))[1];
  const bg=rule.match(/background:(#[a-f0-9]{6})/)[1],fg=rule.match(/(?:^|;)color:(#[a-f0-9]{6})/)[1];backgrounds.push(bg);assert.ok(contrast(fg,bg)>=4.5,type);
 }
 assert.equal(new Set(backgrounds).size,6);assert.ok(contrast('#ad481f','#ffffff')>=4.5);
});
