import {NextResponse} from 'next/server';
import {getAdminContext} from '@/lib/admin-access';

const PRICE_STATUSES = new Set(['unknown','available','free','missing','not_applicable']);
const text = (value:unknown, limit:number) => typeof value === 'string' ? value.trim().slice(0,limit) : '';
const nullableText = (value:unknown, limit:number) => text(value,limit) || null;
const nullableNumber = (value:unknown, min:number, max:number) => {
  if (value === '' || value == null) return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= min && number <= max ? number : undefined;
};

export async function PUT(request:Request,{params}:{params:Promise<{id:string}>}) {
  const {id} = await params;
  const {supabase,user,admin} = await getAdminContext();
  if (!user) return NextResponse.json({error:'กรุณาเข้าสู่ระบบ'},{status:401});
  if (!admin) return NextResponse.json({error:'ไม่มีสิทธิ์ Admin'},{status:403});
  const body = await request.json();
  const latitude = nullableNumber(body.latitude,-90,90);
  const longitude = nullableNumber(body.longitude,-180,180);
  const duration = nullableNumber(body.recommendedDurationMinutes,1,1440);
  const priceDataStatus = String(body.priceDataStatus ?? 'unknown');
  if (latitude === undefined || longitude === undefined || duration === undefined || !PRICE_STATUSES.has(priceDataStatus)) {
    return NextResponse.json({error:'ข้อมูลรูปแบบไม่ถูกต้อง'},{status:400});
  }
  const {data,error} = await supabase.from('places').update({
    description: nullableText(body.description,5000),
    address: nullableText(body.address,1000),
    latitude,
    longitude,
    recommended_duration_minutes: duration,
    price_data_status: priceDataStatus,
    price_data_note: nullableText(body.priceDataNote,2000),
  }).eq('id',id).is('business_id',null).select('id').maybeSingle();
  if (error) return NextResponse.json({error:error.message},{status:500});
  if (!data) return NextResponse.json({error:'ไม่พบ Place ที่ดูแลได้'},{status:404});
  return NextResponse.json({success:true});
}
