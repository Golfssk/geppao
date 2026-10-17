'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {useRef,useState} from 'react';
import {createBrowserClient} from '@supabase/ssr';
import {useLocale} from '@/components/i18n/LocaleProvider';
import {hardAuthNavigate} from '@/lib/auth/navigation';
import styles from './UserNav.module.css';
type Props={name:string;email:string|null;isAdmin:boolean;layout?:'inline'|'sidebar'};
export function UserNav({name,email,isAdmin,layout='inline'}:Props){
 const pathname=usePathname(),{locale}=useLocale(),en=locale==='en';
 const gate=useRef(false);
 const [pending,setPending]=useState(false),[error,setError]=useState(false);
 const inAdmin=pathname==='/admin'||pathname.startsWith('/admin/')||pathname==='/demo/admin'||pathname.startsWith('/demo/admin/');
 async function signOut(){
  if(gate.current)return;
  gate.current=true;setPending(true);setError(false);
  try{
   const supabase=createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
   const result=await supabase.auth.signOut();
   if(result.error)throw result.error;
   hardAuthNavigate('/');
  }catch{setError(true);gate.current=false;setPending(false)}
 }

 if(!email)return <Link href={`/host/login?next=${encodeURIComponent(pathname||'/')}`} className={`btn btn-primary ${layout==='sidebar'?styles.signIn:''}`}>{en?'Sign in to save trips':'เข้าสู่ระบบเพื่อบันทึกทริป'}</Link>;
 return <div className={`${styles.userNav} ${layout==='sidebar'?styles.sidebarUser:''}`}>
  {layout==='sidebar'&&<span className={styles.avatar} aria-hidden="true">{name.slice(0,2).toUpperCase()}</span>}
  <div className={styles.identity}><strong>{name}</strong><span>{email}</span></div>
  <div className={styles.controls}>{isAdmin&&!inAdmin&&<Link href="/admin" className="btn btn-sage">Admin</Link>}<button className="btn" onClick={signOut} disabled={pending}>{pending?(en?'Signing out…':'กำลังออก…'):(en?'Sign out':'ออกจากระบบ')}</button></div>
  {error&&<span role="alert" className={styles.error}>{en?'Could not sign out. Please retry.':'ออกจากระบบไม่สำเร็จ กรุณาลองใหม่'}</span>}
 </div>;
}
