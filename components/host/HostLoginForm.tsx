'use client';
import {FormEvent,useRef,useState} from 'react';
import {createBrowserClient} from '@supabase/ssr';
import {useRouter} from 'next/navigation';
import {useLocale} from '@/components/i18n/LocaleProvider';
import {safeAuthNext} from '@/lib/auth/redirect';
import styles from './HostLoginForm.module.css';

type Props={nextPath?:string;oauthError?:boolean};
type AuthError='credentials'|'connection'|'oauth'|null;
const client=()=>createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
export function HostLoginForm({nextPath,oauthError}:Props){
 const router=useRouter(),{locale}=useLocale(),en=locale==='en';
 const[email,setEmail]=useState(''),[password,setPassword]=useState('');
 const[showPassword,setShowPassword]=useState(false);
 const[error,setError]=useState<AuthError>(oauthError?'oauth':null);
 const[loading,setLoading]=useState<'password'|'google'|null>(null);
 const pending=useRef(false);
 const errorText=error==='credentials'?(en?'Your email or password is incorrect.':'อีเมลหรือรหัสผ่านไม่ถูกต้องครับ'):error==='oauth'?(en?'Google sign-in was not completed. Please try again.':'เข้าสู่ระบบด้วย Google ไม่สำเร็จ กรุณาลองอีกครั้ง'):(en?'Could not connect to sign-in. Please try again.':'เชื่อมต่อระบบเข้าสู่ระบบไม่สำเร็จ กรุณาลองอีกครั้ง');
 async function submit(e:FormEvent<HTMLFormElement>){
  e.preventDefault();if(pending.current)return;
  pending.current=true;setError(null);setLoading('password');
  try{
   const result=await client().auth.signInWithPassword({email:email.trim(),password});
   if(result.error){setError('credentials');return}
   setPassword('');router.replace(safeAuthNext(nextPath));router.refresh();
  }catch{setError('connection')}
  finally{pending.current=false;setLoading(null)}
 }
 async function signInWithGoogle(){
  if(pending.current)return;pending.current=true;setError(null);setLoading('google');
  try{
   const callback=new URL('/auth/callback',window.location.origin);
   callback.searchParams.set('next',safeAuthNext(nextPath));callback.searchParams.set('lang',locale);
   const result=await client().auth.signInWithOAuth({provider:'google',options:{redirectTo:callback.toString(),queryParams:{access_type:'offline',prompt:'consent'}}});
   if(result.error)throw result.error;
   // Successful OAuth hands navigation to the provider. Keep the gate closed.
  }catch{setError('oauth');pending.current=false;setLoading(null)}
 }
 return <div className={styles.shell}><form onSubmit={submit} className={styles.form} aria-busy={loading!==null}><span className={styles.kicker}>{en?'GEPPAO ACCOUNT':'บัญชี GEPPAO'}</span><h1>{en?'Welcome back':'เข้าสู่ระบบ GepPao'}</h1><p>{en?'One account for your trips, business profile, and local-data work.':'บัญชีเดียวสำหรับทริป ข้อมูลธุรกิจ และงานดูแล Local Data ตามสิทธิ์ของคุณ'}</p><button type="button" className={styles.googleButton} onClick={signInWithGoogle} disabled={loading!==null}><span aria-hidden="true" className={styles.googleMark}>G</span>{loading==='google'?(en?'Connecting…':'กำลังเชื่อมต่อ…'):(en?'Continue with Google':'ดำเนินการต่อด้วย Google')}</button><div className={styles.divider}><span>{en?'or':'หรือ'}</span></div><div className={styles.fields}><div className="form-field"><label htmlFor="email">{en?'Email':'อีเมล'}</label><input id="email" type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" disabled={loading!==null} required/></div><div className="form-field"><label htmlFor="password">{en?'Password':'รหัสผ่าน'}</label><div className={styles.passwordField}><input id="password" type={showPassword?'text':'password'} autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} disabled={loading!==null} required/><button type="button" className={styles.passwordToggle} aria-pressed={showPassword} aria-label={showPassword?(en?'Hide password':'ซ่อนรหัสผ่าน'):(en?'Show password':'แสดงรหัสผ่าน')} onClick={()=>setShowPassword(value=>!value)}>{showPassword?(en?'Hide':'ซ่อน'):(en?'Show':'แสดง')}</button></div></div></div>{error&&<p className="form-error" role="alert">{errorText}</p>}<button className="btn btn-primary" disabled={loading!==null}>{loading==='password'?(en?'Signing in…':'กำลังเข้าสู่ระบบ...'):(en?'Sign in':'เข้าสู่ระบบ')}</button><p className={styles.note}>{en?'After sign-in, you will return to the page you came from.':'หลังเข้าสู่ระบบ คุณจะกลับไปยังหน้าที่เปิดอยู่ก่อนหน้านี้'}</p></form></div>;
}
