import {NextResponse} from 'next/server';
import {getAdminContext} from '@/lib/admin-access';

const UNITS = new Set(['free','person','group','night','room','activity','item']);
export async function PUT(request:Request,{params}:{params:Promise<{id:string}>}) {
  const {id} = await params;
  const {supabase,user,admin} = await getAdminContext();
  if (!user) return NextResponse.json({error:'กรุณาเข้าสู่ระบบ'},{status:401});
  if (!admin) return NextResponse.json({error:'ไม่มีสิทธิ์ Admin'},{status:403});
  const {items} = await request.json();
  if (!Array.isArray(items) || items.length > 20 || items.some(item => {
    const min=Number(item?.amountMin), max=item?.amountMax === '' || item?.amountMax == null ? null : Number(item.amountMax);
    return typeof item?.label !== 'string' || !item.label.trim() || !Number.isFinite(min) || min < 0 || (max != null && (!Number.isFinite(max) || max < min)) || !UNITS.has(item?.unit);
  })) return NextResponse.json({error:'รูปแบบราคาไม่ถูกต้อง'},{status:400});
  const {data:place,error:placeError} = await supabase.from('places').select('id').eq('id',id).is('business_id',null).maybeSingle();
  if (placeError) return NextResponse.json({error:placeError.message},{status:500});
  if (!place) return NextResponse.json({error:'ไม่พบ Place ที่ดูแลได้'},{status:404});
  const clean = items.map(item => ({label:item.label.trim(),amountMin:Number(item.amountMin),amountMax:item.amountMax === '' || item.amountMax == null ? null : Number(item.amountMax),currency:'THB',unit:item.unit,audience:'all',minQuantity:null,isEstimate:Boolean(item.isEstimate),validFrom:'',validUntil:''}));
  const {error} = await supabase.rpc('admin_replace_place_prices',{target_place_id:id,items:clean});
  return error ? NextResponse.json({error:error.message},{status:500}) : NextResponse.json({success:true});
}
