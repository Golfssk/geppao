import {tripMutation,tripUuid,tripFailure,tripRpcResult} from '@/lib/trips/mutation';
type Context={params:Promise<{id:string}>};
export async function POST(request:Request,ctx:Context){
 const c=await tripMutation(request,ctx);if(c.response)return c.response;const b=c.b;
 if(Boolean(b.placeId)===Boolean(b.eventId)||!tripUuid(b.placeId||b.eventId))return tripFailure('เลือกสถานที่หนึ่งรายการ',400);
 const {data,error}=await c.s.rpc('save_trip_wishlist',{target_trip_id:c.id,source_place_id:b.placeId||null,source_event_id:b.eventId||null});return tripRpcResult(data,error);
}
export async function PATCH(request:Request,ctx:Context){
 const c=await tripMutation(request,ctx);if(c.response)return c.response;
 if(!tripUuid(c.b.savedId)||!tripUuid(c.b.tripDayId))return tripFailure('เลือกจุดแวะและวัน',400);
 const {data,error}=await c.s.rpc('schedule_trip_wishlist',{target_trip_id:c.id,saved_stop_id:c.b.savedId,target_day_id:c.b.tripDayId});return tripRpcResult(data,error);
}
export async function DELETE(request:Request,ctx:Context){
 const c=await tripMutation(request,ctx);if(c.response)return c.response;if(!tripUuid(c.b.savedId))return tripFailure('เลือกจุดแวะ',400);
 const {data,error}=await c.s.rpc('remove_trip_wishlist',{target_trip_id:c.id,saved_stop_id:c.b.savedId});return tripRpcResult(data,error);
}
