'use client';
import {FormEvent,useState} from 'react';
import {createBrowserClient} from '@supabase/ssr';
import {useRouter} from 'next/navigation';
import {useLocale} from '@/components/i18n/LocaleProvider';
import styles from './HostLoginForm.module.css';

type Props={nextPath?:string;oauthError?:boolean};
const safeNext=(value?:string)=>value?.startsWith('/')&&!value.startsWith('//')?value:'/trips';
const client=()=>createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export function HostLoginForm({nextPath,oauthError}:Props){
  const router=useRouter();
  const{locale}=useLocale();
  const en=locale==='en';
  const[email,setEmail]=useState('');
  const[password,setPassword]=useState('');
  const[showPassword,setShowPassword]=useState(false);
  const[error,setError]=useState(oauthError?(en?'Google sign-in was not completed. Please try again.':'เข้าสู่ระบบด้วย Google ไม่สำเร็จ กรุณาลองอีกครั้ง'):'');
  const[loading,setLoading]=useState<'password'|'google'|null>(null);
  async function submit(e:FormEvent<HTMLFormElement>){
    e.preventDefault();setError('');setLoading('password');
    const{error}=await client().auth.signInWithPassword({email,password});
    if(error){setError(en?'Your email or password is incorrect.':'อีเมลหรือรหัสผ่านไม่ถูกต้องครับ');setLoading(null);return}
    router.replace(safeNext(nextPath));router.refresh();
  }
  async function signInWithGoogle(){
    setError('');setLoading('google');
    const next=safeNext(nextPath);
    const redirectTo=`${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    const{error}=await client().auth.signInWithOAuth({provider:'google',options:{redirectTo,queryParams:{access_type:'offline',prompt:'consent'}}});
    if(error){setError(en?'Google sign-in is not available yet.':'ยังไม่สามารถเข้าสู่ระบบด้วย Google ได้ กรุณาตรวจสอบการตั้งค่า');setLoading(null)}
  }
  return <div className={styles.shell}><form onSubmit={submit} className={styles.form}><span className={styles.kicker}>GEPPAO ACCOUNT</span><h1>{en?'Welcome back':'เข้าสู่ระบบ GepPao'}</h1><p>{en?'One account for your trips, business profile, and local-data work.':'บัญชีเดียวสำหรับทริป ข้อมูลธุรกิจ และงานดูแล Local Data ตามสิทธิ์ของคุณ'}</p><button type="button" className={styles.googleButton} onClick={signInWithGoogle} disabled={loading!==null}><span aria-hidden="true" className={styles.googleMark}>G</span>{loading==='google'?(en?'Connecting…':'กำลังเชื่อมต่อ…'):(en?'Continue with Google':'ดำเนินการต่อด้วย Google')}</button><div className={styles.divider}><span>{en?'or':'หรือ'}</span></div><div className={styles.fields}><div className="form-field"><label htmlFor="email">{en?'Email':'อีเมล'}</label><input id="email" type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required/></div><div className="form-field"><label htmlFor="password">{en?'Password':'รหัสผ่าน'}</label><div className={styles.passwordField}><input id="password" type={showPassword?'text':'password'} autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required/><button type="button" className={styles.passwordToggle} aria-pressed={showPassword} aria-label={showPassword?(en?'Hide password':'ซ่อนรหัสผ่าน'):(en?'Show password':'แสดงรหัสผ่าน')} onClick={()=>setShowPassword(value=>!value)}>{showPassword?(en?'Hide':'ซ่อน'):(en?'Show':'แสดง')}</button></div></div></div>{error&&<p className="form-error" role="alert">{error}</p>}<button className="btn btn-primary" disabled={loading!==null}>{loading==='password'?(en?'Signing in…':'กำลังเข้าสู่ระบบ...'):(en?'Sign in':'เข้าสู่ระบบ')}</button><p className={styles.note}>{en?'After sign-in, you will return to the page you came from.':'หลังเข้าสู่ระบบ คุณจะกลับไปยังหน้าที่เปิดอยู่ก่อนหน้านี้'}</p></form></div>}
