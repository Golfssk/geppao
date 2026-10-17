import {NextResponse} from 'next/server';
import {createClient} from '@/lib/supabase/server';
import {tripMutation,tripFailure,tripRpcResult,tripUuid} from '@/lib/trips/mutation';
type Context={params:Promise<{id:string}>};
export async function GET(_request:Request,ctx:Context){const{id}=await ctx.params;if(!tripUuid(id))return tripFailure('ไม่พบทริป',404);const s=await createClient(),{data:a}=await s.auth.getUser();if(!a.user)return tripFailure('กรุณาเข้าสู่ระบบ',401);const{data,error}=await s.rpc('get_trip_group_data',{target_trip_id:id});return error?tripRpcResult(null,error):NextResponse.json(data,{headers:{'Cache-Control':'no-store'}})}
export async function POST(request:Request,ctx:Context){const c=await tripMutation(request,ctx);if(c.response)return c.response;const{action,payload={}}=c.b;if(!payload||typeof payload!=='object'||Array.isArray(payload))return tripFailure('ข้อมูลไม่ถูกต้อง',400);let result;
if(action==='invite_create'){if(!['editor','viewer'].includes(payload.role))return tripFailure('เลือกสิทธิ์สมาชิก',400);result=await c.s.rpc('create_trip_invite',{target_trip_id:c.id,member_role:payload.role})}
else if(['revoke_invite','remove_member','set_role'].includes(action)){if(!tripUuid(payload.id))return tripFailure('ข้อมูลไม่ถูกต้อง',400);result=await c.s.rpc('manage_trip_member',{target_trip_id:c.id,action,payload})}
else if(['person_add','expense_add','expense_edit','expense_remove','transfer_add','transfer_remove','checklist_add','checklist_pack','checklist_toggle','checklist_remove','poll_add','poll_toggle','vote','reservation_add','reservation_remove'].includes(action)){result=await c.s.rpc('mutate_trip_group',{target_trip_id:c.id,action,payload})}
else return tripFailure('ไม่รองรับคำสั่งนี้',400);
return tripRpcResult(result.data,result.error)}
