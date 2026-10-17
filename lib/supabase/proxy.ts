import {createServerClient,type CookieOptions} from '@supabase/ssr';
import {NextResponse,type NextRequest} from 'next/server';

// Cookie presence is only a refresh optimization, NEVER an identity/role check.
// Each private page/API and RLS must still validate its own authorization.
export async function refreshAuthSession(request:NextRequest,headers:Headers){
 const hasSessionCookie=request.cookies.getAll().some(({name})=>/^sb-.+-auth-token(?:\.\d+)?$/.test(name));
 const pending:Array<{name:string;value:string;options?:CookieOptions}>=[];
 if(hasSessionCookie){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if(url&&key){
   try{
    const supabase=createServerClient(url,key,{cookies:{
     getAll(){return request.cookies.getAll()},
     setAll(values){
      for(const cookie of values){request.cookies.set(cookie.name,cookie.value);pending.push(cookie)}
      // The downstream server render must see the refreshed token too, not only
      // the Set-Cookie response received by the browser after rendering.
      const cookieHeader=request.headers.get('cookie');
      if(cookieHeader)headers.set('cookie',cookieHeader);else headers.delete('cookie');
     },
    }});
    await supabase.auth.getUser();
   }catch{
    // Do not clear sessions, grant access or log token/provider details on outage.
    // Protected consumers independently fail closed when validation is unavailable.
   }
  }
 }
 const response=NextResponse.next({request:{headers}});
 for(const {name,value,options} of pending)response.cookies.set(name,value,options);
 if(hasSessionCookie){response.headers.set('Cache-Control','private, no-store');response.headers.set('Pragma','no-cache')}
 return response;
}
