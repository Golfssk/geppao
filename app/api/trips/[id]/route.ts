import {NextResponse} from 'next/server';
import {tripMutation,tripFailure,tripVersion,tripVersionRequired} from '@/lib/trips/mutation';
import {tripMetadata} from '@/lib/trips/metadata';
type Context={params:Promise<{id:string}>};
async function write(request:Request,ctx:Context,remove:boolean){
 const result=await tripMutation(request,ctx);if(result.response)return result.response;
 const {s,id,b,userId}=result;
 if(!tripVersion(b.expectedVersion))return tripVersionRequired();
 const patch=remove?null:tripMetadata(b);
 if(remove?Object.keys(b).some(k=>k!=='expectedVersion'):!patch)return tripFailure('ข้อมูลไม่ถูกต้อง',400);
 // RLS remains authoritative. Both predicates also apply to the atomic write,
 // not just this read: a concurrent metadata/item edit must not be overwritten.
 const {data:owned,error:readError}=await s.from('trips').select('id').eq('id',id).eq('owner_user_id',userId).maybeSingle();
 if(readError)return tripFailure('ไม่สามารถตรวจสอบทริปได้',503);
 if(!owned)return tripFailure('ไม่พบทริปที่คุณเป็นเจ้าของ',404);
 const query=remove?s.from('trips').delete():s.from('trips').update({...patch,updated_at:new Date().toISOString()});
 const {data,error}=await query.eq('id',id).eq('owner_user_id',userId).eq('plan_revision',b.expectedVersion).select('id').maybeSingle();
 if(error)return tripFailure('บันทึกไม่สำเร็จ กรุณาโหลดทริปใหม่เพื่อตรวจสอบ',503);
 if(!data)return tripFailure('รายการเปลี่ยนไปแล้ว กรุณาโหลดทริปใหม่',409);
 // AFTER triggers can increment the revision again. Never return a guessed version.
 return NextResponse.json({success:true,id:data.id},{headers:{'Cache-Control':'no-store'}});
}
async function safelyWrite(r:Request,ctx:Context,remove:boolean){try{return await write(r,ctx,remove)}catch{return tripFailure('บันทึกไม่สำเร็จ กรุณาโหลดทริปใหม่เพื่อตรวจสอบ',503)}}
export async function PATCH(r:Request,ctx:Context){return safelyWrite(r,ctx,false)}
export async function DELETE(r:Request,ctx:Context){return safelyWrite(r,ctx,true)}
