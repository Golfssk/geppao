import {NextResponse} from 'next/server';
import {createClient} from '@/lib/supabase/server';
import {safeAuthNext} from '@/lib/auth/redirect';
const headers={'Cache-Control':'private, no-store','Pragma':'no-cache','Referrer-Policy':'no-referrer'};
export async function GET(request:Request){
 const url=new URL(request.url),next=safeAuthNext(url.searchParams.get('next'));
 const codes=url.searchParams.getAll('code');
 if(codes.length===1&&codes[0]&&!url.searchParams.has('error')){
  try{
   const supabase=await createClient();
   const {error}=await supabase.auth.exchangeCodeForSession(codes[0]);
   if(!error)return NextResponse.redirect(new URL(next,url.origin),{status:303,headers});
  }catch{
   // Never expose provider errors, codes or session tokens. A failed exchange
   // returns to a retryable sign-in screen, not an unhandled server error.
  }
 }
 const login=new URL('/host/login',url.origin);
 login.searchParams.set('error','oauth');login.searchParams.set('next',next);
 const lang=url.searchParams.get('lang');if(lang==='th'||lang==='en')login.searchParams.set('lang',lang);
 return NextResponse.redirect(login,{status:303,headers});
}
