import {NextResponse} from 'next/server';
import {getAdminContext} from '@/lib/admin-access';

const time = /^([01]\d|2[0-3]):[0-5]\d$/;
const nullableInteger = (value:unknown,min:number,max:number) => {
  if (value === '' || value == null) return null;
  const number = Number(value);
  return Number.isInteger(number) && number >= min && number <= max ? number : undefined;
};
const nullableText = (value:unknown,limit:number) => typeof value === 'string' && value.trim() ? value.trim().slice(0,limit) : null;

export async function PUT(request:Request,{params}:{params:Promise<{id:string}>}) {
  const {id} = await params;
  const {supabase,user,admin} = await getAdminContext();
  if (!user) return NextResponse.json({error:'กรุณาเข้าสู่ระบบ'},{status:401});
  if (!admin) return NextResponse.json({error:'ไม่มีสิทธิ์ Admin'},{status:403});

  const body = await request.json();
  const checkInTime = nullableText(body.checkInTime,5);
  const checkOutTime = nullableText(body.checkOutTime,5);
  const roomCount = nullableInteger(body.roomCount,0,100000);
  const maximumGuests = nullableInteger(body.maximumGuests,1,1000000);
  if (roomCount === undefined || maximumGuests === undefined
    || (checkInTime != null && !time.test(checkInTime))
    || (checkOutTime != null && !time.test(checkOutTime))
    || Boolean(checkInTime) !== Boolean(checkOutTime)) {
    return NextResponse.json({error:'ข้อมูลที่พักไม่ถูกต้อง — Check-in และ Check-out ต้องกรอกเป็นคู่'},{status:400});
  }

  const details = {
    accommodationType: nullableText(body.accommodationType,200),
    roomCount,
    maximumGuests,
    checkInTime,
    checkOutTime,
  };
  const {data,error} = await supabase.rpc('admin_upsert_accommodation_details',{
    target_place_id:id,
    details,
  });
  return error ? NextResponse.json({error:error.message},{status:500}) : NextResponse.json({success:true,data});
}
