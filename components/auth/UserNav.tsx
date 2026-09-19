'use client';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {createBrowserClient} from '@supabase/ssr';
import styles from './UserNav.module.css';

type Props={name:string;email:string|null;isAdmin:boolean};
export function UserNav({name,email,isAdmin}:Props){const router=useRouter();async function signOut(){const supabase=createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);await supabase.auth.signOut();router.push('/');router.refresh()}if(!email)return <Link href="/host/login" className="btn btn-primary">เข้าสู่ระบบ</Link>;return <div className={styles.userNav}>{isAdmin&&<Link href="/admin" className="btn btn-sage">Admin</Link>}<div className={styles.identity}><strong>{name}</strong><span>{email}</span></div><button className="btn" onClick={signOut}>ออกจากระบบ</button></div>}
