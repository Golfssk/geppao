import {randomUUID} from 'node:crypto';
import {NextResponse} from 'next/server';
import {createClient} from '@/lib/supabase/server';
type Context={params:Promise<{id:string}>};
async function owner(request:Request,ctx:Context){
 const fail=(status:number)=>({response:NextResponse.json({error:'ไม่มีสิทธิ์จัดการลิงก์แชร์'},{status})});
 const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin||request.headers.get('sec-fetch-site')==='cross-site')return fail(403);
 const {id}=await ctx.params;if(!/^[0-9a-f-]{36}$/i.test(id))return fail(404);
 const s=await createClient(),{data:auth}=await s.auth.getUser();if(!auth.user)return fail(401);
 const {data:trip,error}=await s.from('trips').select('id').eq('id',id).eq('owner_user_id',auth.user.id).maybeSingle();if(error)return fail(503);if(!trip)return fail(403);return {s,id,userId:auth.user.id};
}
export async function POST(request:Request,ctx:Context){
 const c=await owner(request,ctx);if('response' in c)return c.response;
 const {data,error}=await c.s.from('trips').update({share_token:randomUUID(),updated_at:new Date().toISOString()}).eq('id',c.id).eq('owner_user_id',c.userId).select('share_token').maybeSingle();
 return error||!data?NextResponse.json({error:'สร้างลิงก์ไม่สำเร็จ'},{status:503}):NextResponse.json({url:`/share/trips/${data.share_token}`},{headers:{'Cache-Control':'no-store'}});
}
export async function DELETE(request:Request,ctx:Context){
 const c=await owner(request,ctx);if('response' in c)return c.response;
 const {data,error}=await c.s.from('trips').update({share_token:null,updated_at:new Date().toISOString()}).eq('id',c.id).eq('owner_user_id',c.userId).select('id').maybeSingle();
 return error||!data?NextResponse.json({error:'ปิดลิงก์ไม่สำเร็จ'},{status:503}):NextResponse.json({success:true});
}
