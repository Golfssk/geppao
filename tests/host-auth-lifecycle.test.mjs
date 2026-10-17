import test from 'node:test';import assert from 'node:assert/strict';import React from 'react';
import {sourceModule} from './intake-route-fixture.mjs';
import {safeAuthNext} from '../lib/auth/redirect.ts';
function hooks(){const slots=[],effects=[];let index=0;return{slots,effects,react:{...React,useState(v){const i=index++;if(!(i in slots))slots[i]=v;return[slots[i],v=>slots[i]=v]},useRef(v){const i=index++;if(!(i in slots))slots[i]={current:v};return slots[i]},useEffect(fn){effects.push(fn)}},render(C,p){index=0;return C(p)}}}
function all(t,p,out=[]){if(!t||typeof t!=='object')return out;if(p(t))out.push(t);for(const c of[t.props?.children].flat(Infinity))all(c,p,out);return out}
const button=t=>all(t,n=>n.type==='button')[0];
async function navComponent(h,auth,navigate,locale=()=> 'en'){
 return(await sourceModule('components/auth/UserNav.tsx',{'react':h.react,'next/link':()=>null,'next/navigation':{usePathname:()=>'/trips'},'@supabase/ssr':{createBrowserClient:()=>({auth})},'@/components/i18n/LocaleProvider':{useLocale:()=>({locale:locale()})},'@/lib/auth/navigation':{hardAuthNavigate:navigate},'./UserNav.module.css':{}},{process:{env:{}}})).UserNav;
}
const props={name:'Synthetic',email:'synthetic@example.invalid',isAdmin:false};
test('logout gates double submissions, preserves SDK scope, and replaces document only after success',async()=>{
 const h=hooks(),dest=[];let calls=0,resolve;
 const C=await navComponent(h,{signOut:async(...args)=>{assert.equal(args.length,0);calls++;return new Promise(r=>resolve=r)}},p=>dest.push(p));
 let t=h.render(C,props);const first=button(t).props.onClick();await button(t).props.onClick();assert.equal(calls,1);assert.deepEqual(dest,[]);
 resolve({error:null});await first;t=h.render(C,props);assert.deepEqual(dest,['/']);assert.equal(button(t).props.disabled,true);
});
test('logout provider errors and exceptions allow retry, never navigate and translate on rerender',async()=>{
 const h=hooks();let locale='en',calls=0;const C=await navComponent(h,{signOut:async()=>{calls++;if(calls===1)return{error:new Error('PRIVATE')};throw Error('PRIVATE')}},()=>assert.fail('must not navigate'),()=>locale);
 let t=h.render(C,props);await button(t).props.onClick();t=h.render(C,props);assert.equal(button(t).props.disabled,false);assert.match(all(t,n=>n.props?.role==='alert')[0].props.children,/Could not sign out/);
 locale='th';t=h.render(C,props);assert.match(all(t,n=>n.props?.role==='alert')[0].props.children,/ออกจากระบบไม่สำเร็จ/);await button(t).props.onClick();assert.equal(calls,2);
});
async function boundary(userId='a',getUser=async()=>({data:{user:{id:'a'}},error:null})){
 const h=hooks(),win=new EventTarget(),doc=new EventTarget(),dest=[];let callback,unsub=0;
 win.location={pathname:'/trips/123',search:'?lang=en',hash:'#plan'};doc.visibilityState='visible';
 const C=(await sourceModule('components/auth/AuthSessionBoundary.tsx',{'react':h.react,'@supabase/ssr':{createBrowserClient:()=>({auth:{getUser,onAuthStateChange(cb){callback=cb;return{data:{subscription:{unsubscribe(){unsub++}}}}}}})},'@/components/i18n/LocaleProvider':{useLocale:()=>({locale:'en'})},'@/lib/auth/navigation':{hardAuthNavigate:p=>dest.push(p)}},{process:{env:{}},window:win,document:doc})).AuthSessionBoundary;
 const p={userId,children:React.createElement('input',{defaultValue:'unsaved'})};let tree=h.render(C,p);const container=all(tree,n=>n.type==='div')[0];container.props.ref.current={hidden:false,inert:false};const element=container.props.ref.current;const cleanup=h.effects[0]();
 return{h,win,doc,dest,element,cleanup,event:(...args)=>callback(...args),render:()=>h.render(C,p),unsub:()=>unsub};
}
const tick=()=>new Promise(r=>setImmediate(r));
test('same-user refresh preserves drafts; changed account hides synchronously and reloads current route once',async()=>{
 const b=await boundary();b.event('TOKEN_REFRESHED',{user:{id:'a'}});assert.equal(b.element.hidden,false);assert.deepEqual(b.dest,[]);
 b.event('SIGNED_IN',{user:{id:'b'}});assert.equal(b.element.hidden,true);assert.equal(b.element.inert,true);assert.deepEqual(b.dest,['/trips/123?lang=en#plan']);
 b.event('SIGNED_OUT',null);assert.equal(b.dest.length,1);b.cleanup();assert.equal(b.unsub(),1);
});
test('cross-tab signout removes prior content and returns home; late verification cannot reveal it',async()=>{
 let resolve;const b=await boundary('a',()=>new Promise(r=>resolve=r));b.win.dispatchEvent(new Event('focus'));assert.equal(b.element.hidden,true);
 b.event('SIGNED_OUT',null);resolve({data:{user:{id:'a'}},error:null});await tick();assert.equal(b.element.hidden,true);assert.deepEqual(b.dest,['/']);b.cleanup();
});
test('outage hides existing content without clearing session; retry restores same mounted draft',async()=>{
 let calls=0;const b=await boundary('a',async()=>{calls++;return calls===1?{data:{user:null},error:{name:'AuthRetryableFetchError'}}:{data:{user:{id:'a'}},error:null}});
 b.win.dispatchEvent(new Event('focus'));b.doc.dispatchEvent(new Event('visibilitychange'));await tick();assert.equal(calls,1);assert.equal(b.element.hidden,true);assert.deepEqual(b.dest,[]);
 let t=b.render();assert.match(all(t,n=>n.props?.role==='alert')[0].props.children,/Could not verify/);assert.equal(all(t,n=>n.type==='div')[0].props.children.props.defaultValue,'unsaved');
 button(t).props.onClick();await tick();assert.equal(b.element.hidden,false);assert.equal(calls,2);b.cleanup();
});
test('focus detects expired session and BFCache restore revalidates; disposed results do nothing',async()=>{
 const b=await boundary('a',async()=>({data:{user:null},error:{name:'AuthSessionMissingError'}}));
 const hide=new Event('pagehide');hide.persisted=true;b.win.dispatchEvent(hide);assert.equal(b.element.hidden,true);
 const show=new Event('pageshow');show.persisted=true;b.win.dispatchEvent(show);await tick();assert.deepEqual(b.dest,['/']);b.cleanup();
 let resolve;const c=await boundary('a',()=>new Promise(r=>resolve=r));c.win.dispatchEvent(new Event('focus'));c.cleanup();resolve({data:{user:null},error:null});await tick();assert.deepEqual(c.dest,[]);c.win.dispatchEvent(new Event('focus'));
});
test('guests leave login redirect ownership to form; explicit logout navigation still masks document',async()=>{
 const b=await boundary(null);b.win.dispatchEvent(new Event('focus'));assert.equal(b.element.hidden,false);b.win.dispatchEvent(new Event('geppao:auth-navigation'));assert.equal(b.element.hidden,true);b.cleanup();
});
test('hard auth navigation sanitizes target, signals invalidation and deduplicates document replacement',async()=>{
 const win=new EventTarget(),dest=[];let signals=0;win.location={replace:p=>dest.push(p)};win.addEventListener('geppao:auth-navigation',()=>signals++);
 const {hardAuthNavigate}=await sourceModule('lib/auth/navigation.ts',{'./redirect':{safeAuthNext}},{window:win,Event});
 hardAuthNavigate('//evil.invalid');hardAuthNavigate('/');assert.deepEqual(dest,['/trips']);assert.equal(signals,1);
});
