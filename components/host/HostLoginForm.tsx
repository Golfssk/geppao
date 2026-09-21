'use client';
import {FormEvent,useState} from 'react';
import {createBrowserClient} from '@supabase/ssr';
import {useRouter} from 'next/navigation';
import {useLocale} from '@/components/i18n/LocaleProvider';
import styles from './HostLoginForm.module.css';

type Props={nextPath?:string};
const safeNext=(value?:string)=>value?.startsWith('/')&&!value.startsWith('//')?value:'/trips';

export function HostLoginForm({nextPath}:Props){
  const router=useRouter();
  const{locale}=useLocale();
  const en=locale==='en';
  const[email,setEmail]=useState('');
  const[password,setPassword]=useState('');
  const[showPassword,setShowPassword]=useState(false);
  const[error,setError]=useState('');
  const[loading,setLoading]=useState(false);
  async function submit(e:FormEvent<HTMLFormElement>){
    e.preventDefault();setError('');setLoading(true);
    const s=createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const{error}=await s.auth.signInWithPassword({email,password});
    if(error){setError(en?'Your email or password is incorrect.':'อีเมลหรือรหัสผ่านไม่ถูกต้องครับ');setLoading(false);return}
    router.replace(safeNext(nextPath));router.refresh();
  }
  return <div className={styles.shell}><form onSubmit={submit} className={styles.form}><span className={styles.kicker}>GEPPAO ACCOUNT</span><h1>{en?'Welcome back':'เข้าสู่ระบบ GepPao'}</h1><p>{en?'One account for your trips, business profile, and local-data work.':'บัญชีเดียวสำหรับทริป ข้อมูลธุรกิจ และงานดูแล Local Data ตามสิทธิ์ของคุณ'}</p><div className={styles.fields}><div className="form-field"><label htmlFor="email">{en?'Email':'อีเมล'}</label><input id="email" type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required/></div><div className="form-field"><label htmlFor="password">{en?'Password':'รหัสผ่าน'}</label><div className={styles.passwordField}><input id="password" type={showPassword?'text':'password'} autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required/><button type="button" className={styles.passwordToggle} aria-pressed={showPassword} aria-label={showPassword?(en?'Hide password':'ซ่อนรหัสผ่าน'):(en?'Show password':'แสดงรหัสผ่าน')} onClick={()=>setShowPassword(value=>!value)}>{showPassword?(en?'Hide':'ซ่อน'):(en?'Show':'แสดง')}</button></div></div></div>{error&&<p className="form-error" role="alert">{error}</p>}<button className="btn btn-primary" disabled={loading}>{loading?(en?'Signing in…':'กำลังเข้าสู่ระบบ...'):(en?'Sign in':'เข้าสู่ระบบ')}</button><p className={styles.note}>{en?'After sign-in, you will return to the page you came from.':'หลังเข้าสู่ระบบ คุณจะกลับไปยังหน้าที่เปิดอยู่ก่อนหน้านี้'}</p></form></div>}
