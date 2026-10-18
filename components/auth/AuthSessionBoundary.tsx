'use client';
import {useEffect,useMemo,useRef,useState,type ReactNode} from 'react';
import {createBrowserClient} from '@supabase/ssr';
import {useLocale} from '@/components/i18n/LocaleProvider';
import {createDraftScope} from '@/lib/planner/draft-scope';
import {PlannerDraftContext} from './PlannerDraftScope';
import {hardAuthNavigate} from '@/lib/auth/navigation';

// Auth events are invalidation signals, never authorization or identity grants.
export function AuthSessionBoundary({userId,children}:{userId:string|null;children:ReactNode}){
 const {locale}=useLocale(),en=locale==='en';
 const scope=useMemo(()=>createDraftScope(userId),[userId]);
 const content=useRef<HTMLDivElement>(null),retry=useRef<()=>void>(()=>{});
 const [state,setState]=useState<'ready'|'checking'|'unavailable'|'leaving'>('ready');
 useEffect(()=>{
  let disposed=false,leaving=false,checking=false;
  scope.setAvailable(state==='ready');
  const mask=(next:typeof state)=>{
   if(disposed)return;
   scope.setAvailable(next==='ready');
   if(content.current){content.current.hidden=next!=='ready';content.current.inert=next!=='ready'}
   setState(next);
  };
  const depart=()=>{scope.close();leaving=true;mask('leaving')};
  const invalidate=(id:string|null)=>{
   if(disposed||leaving||id===userId)return;
   depart();
   // Logout leaves private routes; account switches re-render the route on server.
   try{hardAuthNavigate(id?window.location.pathname+window.location.search+window.location.hash:'/')}catch{leaving=false;mask('unavailable')}
  };
  window.addEventListener('geppao:auth-navigation',depart);
  // Guest sign-in navigation belongs to the login form / PKCE callback. Do not
  // race it with a reload of /login, or block public pages on provider outages.
  if(!userId)return()=>{scope.setAvailable(false);disposed=true;window.removeEventListener('geppao:auth-navigation',depart)};
  const supabase=createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>{
   // Synchronous: calling awaited auth methods here can deadlock the SDK lock.
   invalidate(session?.user.id??null);
  });
  const verify=async()=>{
   if(disposed||leaving||checking)return;
   checking=true;mask('checking');
   try{
    const {data,error}=await supabase.auth.getUser();
    if(disposed||leaving)return;
    if(error&&error.name!=='AuthSessionMissingError'){mask('unavailable');return}
    const id=data.user?.id??null;
    if(id!==userId)invalidate(id);else mask('ready');
   }catch{if(!disposed&&!leaving)mask('unavailable')}
   finally{checking=false}
  };
  retry.current=()=>{void verify()};
  const focus=()=>{if(document.visibilityState==='visible')void verify()};
  const pagehide=(event:PageTransitionEvent)=>{if(event.persisted)mask('checking')};
  const pageshow=(event:PageTransitionEvent)=>{if(event.persisted)void verify()};
  window.addEventListener('focus',focus);
  document.addEventListener('visibilitychange',focus);
  window.addEventListener('pagehide',pagehide);
  window.addEventListener('pageshow',pageshow);
  return()=>{
   scope.setAvailable(false);disposed=true;subscription.unsubscribe();retry.current=()=>{};
   window.removeEventListener('geppao:auth-navigation',depart);
   window.removeEventListener('focus',focus);document.removeEventListener('visibilitychange',focus);
   window.removeEventListener('pagehide',pagehide);window.removeEventListener('pageshow',pageshow);
  };
 },[userId,scope]);
 return <PlannerDraftContext.Provider value={{scope,available:state==='ready'}}>
  {state!=='ready'&&<section style={{padding:'2rem',maxWidth:640,margin:'auto'}} aria-live="polite">
   <p role={state==='unavailable'?'alert':'status'}>{state==='unavailable'?(en?'Could not verify your session. Your page is hidden until verification succeeds.':'ตรวจสอบเซสชันไม่สำเร็จ ซ่อนหน้านี้ไว้จนกว่าจะตรวจสอบสำเร็จ'):state==='leaving'?(en?'Your account changed. Loading a fresh page…':'บัญชีมีการเปลี่ยนแปลง กำลังโหลดหน้าใหม่…'):(en?'Checking your session…':'กำลังตรวจสอบเซสชัน…')}</p>
   {state==='unavailable'&&<><button className="btn" onClick={()=>retry.current()}>{en?'Retry':'ลองใหม่'}</button> <a href="/">{en?'Go to home':'กลับหน้าหลัก'}</a></>}
  </section>}
  <div key={userId===null?'guest':'user:'+userId} ref={content} hidden={state!=='ready'} inert={state!=='ready'} style={state!=='ready'?{display:'none'}:undefined}>{children}</div>
 </PlannerDraftContext.Provider>;
}
