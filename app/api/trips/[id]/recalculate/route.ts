import {NextResponse} from 'next/server';
import {calculateTripDay,type CalculationItemInput} from '@/lib/trip-intelligence';
import {tripMutation,tripFailure,tripRpcResult,tripVersion,tripVersionRequired} from '@/lib/trips/mutation';
export async function POST(request:Request,ctx:{params:Promise<{id:string}>}){
 const c=await tripMutation(request,ctx);if(c.response)return c.response;if(!tripVersion(c.b.expectedVersion))return tripVersionRequired();
 const {data,error}=await c.s.rpc('trip_calculation_snapshot',{target_trip_id:c.id});if(error)return tripRpcResult(null,error);
 const snapshot=data?.snapshot;if(!snapshot||snapshot.trip.plan_revision!==c.b.expectedVersion)return tripFailure('รายการเปลี่ยนไปแล้ว กรุณาโหลดทริปใหม่',409);
 const {trip,days,items}=snapshot,preferences=trip.preferences??{};
 const nights=Math.round((Date.parse(trip.end_date+'T00:00:00+07:00')-Date.parse(trip.start_date+'T00:00:00+07:00'))/86400000);
 const results=days.map((day:any)=>{const calculation=calculateTripDay(items.filter((i:any)=>i.trip_day_id===day.id) as CalculationItemInput[],{serviceDate:day.service_date,travelers:trip.travelers,nights:nights>0?nights:null,rooms:Number.isInteger(Number(preferences.rooms))&&Number(preferences.rooms)>0?Number(preferences.rooms):null});return {dayId:day.id,dayNumber:day.day_number,serviceDate:day.service_date,...calculation}});
 const {error:commitError}=await c.s.rpc('commit_trip_calculation',{target_trip_id:c.id,expected_revision:c.b.expectedVersion,expected_fingerprint:data.fingerprint,calculated_days:results});if(commitError)return tripRpcResult(null,commitError);
 return NextResponse.json({tripId:c.id,calculatedAt:new Date().toISOString(),days:results},{headers:{'Cache-Control':'no-store'}});
}
