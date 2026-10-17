import {tripMutation,tripUuid,tripFailure,tripRpcResult} from '@/lib/trips/mutation';
export async function POST(request:Request,ctx:{params:Promise<{id:string}>}){
 const c=await tripMutation(request,ctx);if(c.response)return c.response;
 if(!tripUuid(c.b.itemId)||!tripUuid(c.b.fromDayId)||!tripUuid(c.b.tripDayId))return tripFailure('เลือกจุดแวะและวันให้ครบ',400);
 const {data,error}=await c.s.rpc('move_trip_item',{target_trip_id:c.id,target_item_id:c.b.itemId,expected_day_id:c.b.fromDayId,target_day_id:c.b.tripDayId});return tripRpcResult(data,error);
}
