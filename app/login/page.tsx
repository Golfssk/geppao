import {redirect} from 'next/navigation';
import {safeAuthNext} from '@/lib/auth/redirect';
export default async function Login({searchParams}:{searchParams:Promise<{next?:string|string[];lang?:string|string[]}>}){
 const params=await searchParams;
 const query=new URLSearchParams({next:safeAuthNext(params.next)});
 if(params.lang==='th'||params.lang==='en')query.set('lang',params.lang);
 redirect('/host/login?'+query.toString());
}
