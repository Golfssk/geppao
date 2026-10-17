import {NextResponse} from 'next/server';
import {createClient} from '@/lib/supabase/server';
export const tripUuid=(v:unknown):v is string=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
export const tripFailure=(error:string,status:number)=>NextResponse.json({error},{status,headers:{'Cache-Control':'no-store'}});
export const tripVersion=(value:unknown):value is number=>typeof value==='number'&&Number.isSafeInteger(value)&&value>=1;
export const tripVersionRequired=()=>tripFailure('กรุณาโหลดทริปใหม่ก่อนบันทึก ข้อมูลนี้ไม่มีเลขรุ่นของแผน',428);
export async function tripMutation(request:Request,ctx:{params:Promise<{id:string}>}){
 const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin||request.headers.get('sec-fetch-site')==='cross-site')return {response:tripFailure('ไม่อนุญาตคำขอจากเว็บไซต์อื่น',403)};
 if(Number(request.headers.get('content-length')||0)>12000)return {response:tripFailure('ข้อมูลใหญ่เกินไป',413)};
 const {id}=await ctx.params;if(!tripUuid(id))return {response:tripFailure('ไม่พบทริป',404)};
 const s=await createClient(),{data:auth}=await s.auth.getUser();if(!auth.user)return {response:tripFailure('กรุณาเข้าสู่ระบบ',401)};
 let b:any;try{const text=await request.text();if(text.length>12000)return {response:tripFailure('ข้อมูลใหญ่เกินไป',413)};b=JSON.parse(text)}catch{return {response:tripFailure('ข้อมูลไม่ถูกต้อง',400)}}
 if(!b||typeof b!=='object'||Array.isArray(b))return {response:tripFailure('ข้อมูลไม่ถูกต้อง',400)};return {s,id,b,userId:auth.user.id};
}
export function tripRpcResult(data:unknown,error:{code?:string}|null){
 if(error&&['23514','23502','23503','22P02','22003','22007','22008'].includes(error.code??''))return tripFailure('ข้อมูลไม่ถูกต้อง กรุณาตรวจจำนวนเงิน สมาชิก และวันที่',400);
 if(error)return tripFailure(error.code==='42501'?'ไม่มีสิทธิ์แก้ไขทริปนี้':error.code==='55000'?'กรุณาปลดล็อกรายการก่อนแก้ไขหรือย้าย':error.code==='40001'?'รายการเปลี่ยนไปแล้ว กรุณาโหลดทริปใหม่':error.code==='22023'?'ข้อมูลหรือรายการที่เลือกยังไม่พร้อมใช้ กรุณาตรวจแล้วลองใหม่':'บันทึกไม่สำเร็จ กรุณาลองใหม่',['42501'].includes(error.code??'')?403:['40001','55000','22023'].includes(error.code??'')?409:503);
 return NextResponse.json({success:true,id:data},{headers:{'Cache-Control':'no-store'}});
}
