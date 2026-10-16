import {NextResponse} from 'next/server';
import {createClient} from '@/lib/supabase/server';
import {publicTripPayload} from '@/lib/planner/workspace';
export async function GET(_:Request,{params}:{params:Promise<{token:string}>}){
 const {token}=await params;if(!/^[0-9a-f-]{36}$/i.test(token))return NextResponse.json({error:'ไม่พบลิงก์แชร์'},{status:404});
 const s=await createClient(),{data,error}=await s.rpc('get_shared_trip',{target_share_token:token}),safe=publicTripPayload(data);
 return error||!safe?NextResponse.json({error:'ไม่พบลิงก์แชร์หรือปิดการแชร์แล้ว'},{status:404,headers:{'Cache-Control':'no-store'}}):NextResponse.json(safe,{headers:{'Cache-Control':'no-store'}});
}
