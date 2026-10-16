import {NextResponse} from 'next/server';
import {createClient} from '@/lib/supabase/server';
type Context={params:Promise<{id:string}>};
const fail=(error:string,status:number)=>NextResponse.json({error},{status});
const uuid=(value:unknown)=>typeof value==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
async function context(request:Request,ctx:Context){
 const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin||request.headers.get('sec-fetch-site')==='cross-site')return {response:fail('ไม่อนุญาตคำขอจากเว็บไซต์อื่น',403)};
 if(Number(request.headers.get('content-length')||0)>16000)return {response:fail('ข้อมูลใหญ่เกินไป',413)};
 const {id}=await ctx.params;if(!uuid(id))return {response:fail('ไม่พบทริป',404)};
 const s=await createClient();const {data:auth}=await s.auth.getUser();if(!auth.user)return {response:fail('กรุณาเข้าสู่ระบบ',401)};
 const {data:canEdit,error}=await s.rpc('can_edit_trip',{target_trip_id:id});if(error)return {response:fail('ตรวจสอบสิทธิ์ไม่สำเร็จ',503)};if(!canEdit)return {response:fail('ไม่มีสิทธิ์แก้ไขทริปนี้',403)};
 let body:any;try{body=await request.json()}catch{return {response:fail('ข้อมูลไม่ถูกต้อง',400)}}if(!body||typeof body!=='object'||Array.isArray(body))return {response:fail('ข้อมูลไม่ถูกต้อง',400)};
 return {s,id,body};
}
export async function POST(request:Request,ctx:Context){
 const c=await context(request,ctx);if(c.response)return c.response;const {s,id,body:b}=c;
 if(!uuid(b.tripDayId)||Boolean(b.placeId)===Boolean(b.eventId)||!uuid(b.placeId||b.eventId))return fail('กรุณาเลือกวันและสถานที่',400);
 const {data:day}=await s.from('trip_days').select('id').eq('id',b.tripDayId).eq('trip_id',id).maybeSingle();if(!day)return fail('ไม่พบวันในทริป',404);
 const {data:place}=await s.from(b.placeId?'places':'events').select('id').eq('id',b.placeId||b.eventId).eq('publication_status','published').maybeSingle();if(!place)return fail('สถานที่นี้ยังไม่เผยแพร่',409);
 if(b.estimatedCost!=null&&(!Number.isFinite(b.estimatedCost)||b.estimatedCost<0))return fail('ราคาไม่ถูกต้อง',400);
 const {data:last,error:rankError}=await s.from('trip_items').select('position').eq('trip_day_id',day.id).order('position',{ascending:false}).limit(1).maybeSingle();if(rankError)return fail('โหลดรายการไม่สำเร็จ',503);
 const position=Number(last?.position??-1024)+1024;if(position>2147483647)return fail('จำนวนรายการเกินขีดจำกัด',409);
 const {data,error}=await s.from('trip_items').insert({trip_day_id:day.id,place_id:b.placeId||null,event_id:b.eventId||null,position,estimated_cost:b.estimatedCost??null,recommendation_reason:'เลือกจากสถานที่เผยแพร่'}).select('id').single();return error?fail('เพิ่มรายการไม่สำเร็จ',500):NextResponse.json(data,{status:201});
}
async function existing(c:any){
 const {s,id,body:b}=c;if(!uuid(b.itemId))return null;
 const {data}=await s.from('trip_items').select('id,trip_day_id,is_locked,starts_at,ends_at,trip_days!inner(trip_id)').eq('id',b.itemId).eq('trip_days.trip_id',id).maybeSingle();return data;
}
export async function PATCH(request:Request,ctx:Context){
 const c=await context(request,ctx);if(c.response)return c.response;const row=await existing(c);if(!row)return fail('ไม่พบรายการในทริปนี้',404);const b=c.body,u:Record<string,unknown>={};
 if(row.is_locked&&Object.keys(b).some(key=>!['itemId','isLocked'].includes(key)))return fail('กรุณาปลดล็อกรายการก่อนแก้ไข',409);
 if(b.durationMinutes!==undefined){if(!Number.isInteger(b.durationMinutes)||b.durationMinutes<1||b.durationMinutes>1440)return fail('ระยะเวลาไม่ถูกต้อง',400);u.duration_minutes=b.durationMinutes}
 if(b.position!==undefined){if(!Number.isInteger(b.position)||b.position<-2147483648||b.position>2147483647)return fail('ลำดับไม่ถูกต้อง',400);u.position=b.position}
 if(b.isLocked!==undefined){if(typeof b.isLocked!=='boolean')return fail('สถานะล็อกไม่ถูกต้อง',400);u.is_locked=b.isLocked}
 if(b.notes!==undefined){if(typeof b.notes!=='string'||b.notes.length>2000)return fail('บันทึกยาวเกินไป',400);u.notes=b.notes}
 if(b.estimatedCost!==undefined){if(b.estimatedCost!==null&&(!Number.isFinite(b.estimatedCost)||b.estimatedCost<0))return fail('ราคาไม่ถูกต้อง',400);u.estimated_cost=b.estimatedCost}
 for(const [key,column] of [['startsAt','starts_at'],['endsAt','ends_at']])if(b[key]!==undefined){if(b[key]!==null&&(typeof b[key]!=='string'||!Number.isFinite(Date.parse(b[key]))))return fail('เวลาไม่ถูกต้อง',400);u[column]=b[key]}
 const start=u.starts_at!==undefined?u.starts_at:row.starts_at,end=u.ends_at!==undefined?u.ends_at:row.ends_at;if(start&&end&&Date.parse(String(end))<=Date.parse(String(start)))return fail('เวลาสิ้นสุดต้องหลังเวลาเริ่ม',400);
 if(!Object.keys(u).length)return fail('ไม่มีข้อมูลแก้ไข',400);
 const {data,error}=await c.s.from('trip_items').update(u).eq('id',row.id).eq('trip_day_id',row.trip_day_id).select('id').maybeSingle();return error?fail('แก้ไขไม่สำเร็จ',500):data?NextResponse.json({success:true}):fail('แก้ไขรายการไม่ได้',403);
}
export async function DELETE(request:Request,ctx:Context){
 const c=await context(request,ctx);if(c.response)return c.response;const row=await existing(c);if(!row)return fail('ไม่พบรายการในทริปนี้',404);
 if(row.is_locked)return fail('กรุณาปลดล็อกรายการก่อนลบ',409);
 const {data,error}=await c.s.from('trip_items').delete().eq('id',row.id).eq('trip_day_id',row.trip_day_id).select('id').maybeSingle();return error?fail('ลบไม่สำเร็จ',500):data?NextResponse.json({success:true}):fail('ลบรายการไม่ได้',403);
}
