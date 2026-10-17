import {NextResponse} from 'next/server';
import {createClient} from '@/lib/supabase/server';
import {tripUuid,tripFailure,tripRpcResult} from '@/lib/trips/mutation';
export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;if(!tripUuid(id))return tripFailure('ไม่พบทริป',404);
 const s=await createClient(),{data:auth}=await s.auth.getUser();if(!auth.user)return tripFailure('กรุณาเข้าสู่ระบบ',401);
 const {data,error}=await s.rpc('trip_plan_options',{target_trip_id:id});return error?tripRpcResult(null,error):NextResponse.json(data,{headers:{'Cache-Control':'no-store'}});
}
