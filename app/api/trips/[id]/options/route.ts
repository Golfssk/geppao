import {NextResponse} from 'next/server';
import {createClient} from '@/lib/supabase/server';
export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;if(!/^[0-9a-f-]{36}$/i.test(id))return NextResponse.json({error:'ไม่พบทริป'},{status:404});
 const s=await createClient(),{data:auth}=await s.auth.getUser();if(!auth.user)return NextResponse.json({error:'กรุณาเข้าสู่ระบบ'},{status:401});
 const {data:allowed,error:permissionError}=await s.rpc('can_edit_trip',{target_trip_id:id});if(permissionError)return NextResponse.json({error:'ตรวจสิทธิ์ไม่สำเร็จ'},{status:503});if(!allowed)return NextResponse.json({error:'ไม่มีสิทธิ์แก้ไขทริปนี้'},{status:403});
 const {data,error}=await s.from('trip_days').select('id,day_number,service_date').eq('trip_id',id).order('day_number');return error?NextResponse.json({error:'โหลดวันไม่สำเร็จ'},{status:503}):NextResponse.json({days:data??[]},{headers:{'Cache-Control':'no-store'}});
}
