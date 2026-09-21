import {NextResponse} from 'next/server';
import {createClient} from '@/lib/supabase/server';
const safeNext=(value:string|null)=>value?.startsWith('/')&&!value.startsWith('//')?value:'/trips';
export async function GET(request:Request){const url=new URL(request.url);const code=url.searchParams.get('code');const next=safeNext(url.searchParams.get('next'));if(code){const supabase=await createClient();const{error}=await supabase.auth.exchangeCodeForSession(code);if(!error)return NextResponse.redirect(new URL(next,url.origin))}const login=new URL('/host/login',url.origin);login.searchParams.set('error','oauth');login.searchParams.set('next',next);return NextResponse.redirect(login)}
