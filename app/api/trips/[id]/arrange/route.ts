import {tripMutation,tripUuid,tripFailure,tripRpcResult} from '@/lib/trips/mutation';
export async function POST(request:Request,ctx:{params:Promise<{id:string}>}){
 const c=await tripMutation(request,ctx);if(c.response)return c.response;const b=c.b;
 if(!tripUuid(b.itemId)||!tripUuid(b.sourceDayId)||!tripUuid(b.targetDayId)||(b.beforeItemId!==null&&!tripUuid(b.beforeItemId))||!Array.isArray(b.snapshots)||b.snapshots.length!==(b.sourceDayId===b.targetDayId?1:2))return tripFailure('เลือกจุดแวะและวันให้ครบ',400);
 let count=0;for(const d of b.snapshots){if(!tripUuid(d?.dayId)||!Array.isArray(d.items))return tripFailure('ข้อมูลลำดับไม่ถูกต้อง',400);count+=d.items.length;for(const i of d.items)if(!tripUuid(i?.id)||!Number.isInteger(i.position)||typeof i.locked!=='boolean')return tripFailure('ข้อมูลลำดับไม่ถูกต้อง',400)}
 if(count>100)return tripFailure('จัดลำดับได้ครั้งละไม่เกิน 100 จุดแวะ',400);
 const {data,error}=await c.s.rpc('arrange_trip_item',{target_trip_id:c.id,target_item_id:b.itemId,source_day_id:b.sourceDayId,target_day_id:b.targetDayId,before_item_id:b.beforeItemId,expected_days:b.snapshots});return tripRpcResult(data,error);
}
