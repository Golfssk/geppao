import {NextResponse} from 'next/server';
import {getAdminContext} from '@/lib/admin-access';

const time = /^([01]\d|2[0-3]):[0-5]\d$/;
export async function PUT(request:Request,{params}:{params:Promise<{id:string}>}) {
  const {id} = await params;
  const {supabase,user,admin} = await getAdminContext();
  if (!user) return NextResponse.json({error:'กรุณาเข้าสู่ระบบ'},{status:401});
  if (!admin) return NextResponse.json({error:'ไม่มีสิทธิ์ Admin'},{status:403});
  const {items} = await request.json();
  if (!Array.isArray(items) || items.length > 14 || items.some(item => !Number.isInteger(item?.dayOfWeek) || item.dayOfWeek < 0 || item.dayOfWeek > 6 || (!item.isClosed && (!time.test(item.openTime ?? '') || !time.test(item.closeTime ?? ''))))) {
    return NextResponse.json({error:'รูปแบบเวลาไม่ถูกต้อง'},{status:400});
  }
  const {data:place,error:placeError} = await supabase.from('places').select('id').eq('id',id).is('business_id',null).maybeSingle();
  if (placeError) return NextResponse.json({error:placeError.message},{status:500});
  if (!place) return NextResponse.json({error:'ไม่พบ Place ที่ดูแลได้'},{status:404});
  const {error} = await supabase.rpc('admin_replace_place_hours',{target_place_id:id,items});
  return error ? NextResponse.json({error:error.message},{status:500}) : NextResponse.json({success:true});
}
