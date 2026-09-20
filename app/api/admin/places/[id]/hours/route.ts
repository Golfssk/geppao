import {NextResponse} from 'next/server';
import {getAdminContext} from '@/lib/admin-access';

const time = /^([01]\d|2[0-3]):[0-5]\d$/;

type HourItem = {
  dayOfWeek?: unknown;
  openTime?: unknown;
  closeTime?: unknown;
  isClosed?: unknown;
  crossesMidnight?: unknown;
};

export async function PUT(request:Request,{params}:{params:Promise<{id:string}>}) {
  const {id} = await params;
  const {supabase,user,admin} = await getAdminContext();
  if (!user) return NextResponse.json({error:'กรุณาเข้าสู่ระบบ'},{status:401});
  if (!admin) return NextResponse.json({error:'ไม่มีสิทธิ์ Admin'},{status:403});

  const {items} = await request.json() as {items?: HourItem[]};
  const dayNumbers = Array.isArray(items) ? items.map(item => item.dayOfWeek) : [];
  const invalid = !Array.isArray(items)
    || items.length < 1
    || items.length > 7
    || new Set(dayNumbers).size !== items.length
    || items.some(item =>
      !Number.isInteger(item?.dayOfWeek)
      || Number(item.dayOfWeek) < 0
      || Number(item.dayOfWeek) > 6
      || typeof item.isClosed !== 'boolean'
      || typeof item.crossesMidnight !== 'boolean'
      || (item.isClosed && item.crossesMidnight)
      || (!item.isClosed && (!time.test(String(item.openTime ?? '')) || !time.test(String(item.closeTime ?? ''))))
    );
  if (invalid) return NextResponse.json({error:'รูปแบบเวลาไม่ถูกต้อง — บันทึกเฉพาะวันที่มีข้อมูลยืนยันแล้วอย่างน้อย 1 วัน'},{status:400});

  const {data:place,error:placeError} = await supabase
    .from('places')
    .select('id')
    .eq('id',id)
    .is('business_id',null)
    .maybeSingle();
  if (placeError) return NextResponse.json({error:placeError.message},{status:500});
  if (!place) return NextResponse.json({error:'ไม่พบ Place ที่ดูแลได้'},{status:404});

  const {error} = await supabase.rpc('admin_replace_place_hours',{target_place_id:id,items});
  return error ? NextResponse.json({error:error.message},{status:500}) : NextResponse.json({success:true});
}
