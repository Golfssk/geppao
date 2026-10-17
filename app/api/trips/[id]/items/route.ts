import {tripMutation,tripUuid,tripFailure,tripRpcResult,tripVersion,tripVersionRequired} from '@/lib/trips/mutation';
type Context={params:Promise<{id:string}>};
async function change(request:Request,ctx:Context,action:'add'|'patch'|'delete'){
 const c=await tripMutation(request,ctx);if(c.response)return c.response;const b=c.b;
 if(!tripVersion(b.expectedVersion))return tripVersionRequired();
 if(action==='add'){
  if(!tripUuid(b.tripDayId)||Boolean(b.placeId)===Boolean(b.eventId)||!tripUuid(b.placeId||b.eventId))return tripFailure('กรุณาเลือกวันและสถานที่',400);
 }else if(!tripUuid(b.itemId))return tripFailure('ไม่พบรายการ',400);
 if(b.position!==undefined&&action!=='add')return tripFailure('ใช้เครื่องมือจัดลำดับจุดแวะ',400);
 if(b.durationMinutes!==undefined&&(!Number.isInteger(b.durationMinutes)||b.durationMinutes<1||b.durationMinutes>1440))return tripFailure('ระยะเวลาไม่ถูกต้อง',400);
 if(b.isLocked!==undefined&&typeof b.isLocked!=='boolean'||b.notes!==undefined&&(typeof b.notes!=='string'||b.notes.length>2000)||b.estimatedCost!=null&&(!Number.isFinite(b.estimatedCost)||b.estimatedCost<0||b.estimatedCost>1e9))return tripFailure('ข้อมูลไม่ถูกต้อง',400);
 for(const key of ['startsAt','endsAt'])if(b[key]!==undefined&&b[key]!==null&&(typeof b[key]!=='string'||!Number.isFinite(Date.parse(b[key]))))return tripFailure('เวลาไม่ถูกต้อง',400);
 if(b.startsAt&&b.endsAt&&Date.parse(b.startsAt)>=Date.parse(b.endsAt))return tripFailure('เวลาสิ้นสุดต้องหลังเวลาเริ่ม',400);
 const {data,error}=await c.s.rpc('mutate_trip_item',{target_trip_id:c.id,expected_revision:b.expectedVersion,action,payload:b});return tripRpcResult(data,error);
}
export const POST=(r:Request,c:Context)=>change(r,c,'add');
export const PATCH=(r:Request,c:Context)=>change(r,c,'patch');
export const DELETE=(r:Request,c:Context)=>change(r,c,'delete');
