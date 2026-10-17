import test from 'node:test';import assert from 'node:assert/strict';import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';
import {sourceModule} from './intake-route-fixture.mjs';import {safeAuthNext} from '../lib/auth/redirect.ts';
const css={shell:'shell',form:'form',googleButton:'googleButton'};
function hooks(){const slots=[];let index=0;return{react:{...React,useState(initial){const i=index++;if(!(i in slots))slots[i]=typeof initial==='function'?initial():initial;return[slots[i],v=>{slots[i]=typeof v==='function'?v(slots[i]):v}]},useRef(initial){const i=index++;if(!(i in slots))slots[i]={current:initial};return slots[i]}},render(C,props){index=0;return C(props)}}}
function all(tree,predicate,out=[]){if(!tree||typeof tree!=='object')return out;if(predicate(tree))out.push(tree);for(const c of [tree.props?.children].flat(Infinity))all(c,predicate,out);return out}
const form=t=>all(t,n=>n.type==='form')[0];
const google=t=>all(t,n=>n.type==='button'&&n.props.className==='googleButton')[0];
async function component(h,auth,router,locale=()=> 'en'){
 return (await sourceModule('components/host/HostLoginForm.tsx',{'react':h?.react??React,'@supabase/ssr':{createBrowserClient:()=>({auth})},'next/navigation':{useRouter:()=>router},'@/components/i18n/LocaleProvider':{useLocale:()=>({locale:locale()})},'@/lib/auth/redirect':{safeAuthNext},'./HostLoginForm.module.css':css},{process:{env:{}},window:{location:{origin:'https://example.test'}}})).HostLoginForm;
}
for(const locale of ['th','en'])test('auth form has localized accessible fields and error: '+locale,async()=>{const C=await component(null,{}, {},()=>locale);const html=renderToStaticMarkup(React.createElement(C,{oauthError:true}));assert.match(html,/autoComplete="email"/i);assert.match(html,/autoComplete="current-password"/i);assert.match(html,/role="alert"/);if(locale==='en')assert.doesNotMatch(html,/[ก-๙]/);else assert.match(html,/เข้าสู่ระบบ/)});
test('password login blocks duplicate/cross-provider submissions and navigates only on success',async()=>{
 const h=hooks();let calls=0,oauth=0,resolve;const nav=[];
 const C=await component(h,{signInWithPassword:async()=>{calls++;return new Promise(r=>resolve=r)},signInWithOAuth:async()=>{oauth++;return{error:null}}},{replace:p=>nav.push(p),refresh:()=>nav.push('refresh')});
 let tree=h.render(C,{nextPath:'/planner?lang=en'});const task=form(tree).props.onSubmit({preventDefault(){}});
 await form(tree).props.onSubmit({preventDefault(){}});await google(tree).props.onClick();assert.equal(calls,1);assert.equal(oauth,0);
 resolve({error:null});await task;assert.deepEqual(nav,['/planner?lang=en','refresh']);tree=h.render(C,{});assert.equal(form(tree).props['aria-busy'],false);
});
test('password network failure clears busy state, permits deliberate retry and translates existing error on locale switch',async()=>{
 const h=hooks();let calls=0,locale='en';const C=await component(h,{signInWithPassword:async()=>{calls++;throw new Error('PRIVATE PROVIDER DETAILS')}},{replace(){throw new Error('must not navigate')}},()=>locale);
 let tree=h.render(C,{});await form(tree).props.onSubmit({preventDefault(){}});tree=h.render(C,{});
 assert.equal(form(tree).props['aria-busy'],false);assert.match(all(tree,n=>n.props?.role==='alert')[0].props.children,/Could not connect/);
 locale='th';tree=h.render(C,{});assert.match(all(tree,n=>n.props?.role==='alert')[0].props.children,/เชื่อมต่อ/);
 await form(tree).props.onSubmit({preventDefault(){}});assert.equal(calls,2);
});
test('OAuth exception releases gate; successful redirect retains safe destination and language and prevents duplicate navigation',async()=>{
 const h=hooks();let calls=0;const requests=[];const C=await component(h,{signInWithOAuth:async request=>{calls++;requests.push(request);if(calls===1)throw new Error('PRIVATE');return{error:null}}},{});
 let tree=h.render(C,{nextPath:'/\\evil.invalid'});await google(tree).props.onClick();tree=h.render(C,{nextPath:'/\\evil.invalid'});assert.equal(form(tree).props['aria-busy'],false);assert.ok(all(tree,n=>n.props?.role==='alert').length);
 await google(tree).props.onClick();tree=h.render(C,{});await google(tree).props.onClick();assert.equal(calls,2);
 const u=new URL(requests[1].options.redirectTo);assert.equal(u.origin,'https://example.test');assert.equal(u.searchParams.get('next'),'/trips');assert.equal(u.searchParams.get('lang'),'en');assert.equal(form(tree).props['aria-busy'],true);
});
