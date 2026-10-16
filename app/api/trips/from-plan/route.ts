import {NextResponse} from 'next/server';
import {validDate} from '@/lib/planner/request';
import {POST as recalculateTrip} from '@/app/api/trips/[id]/recalculate/route';
import {createClient} from '@/lib/supabase/server';

const toIso = (serviceDate:string | null, time:string | null) => serviceDate && time ? `${serviceDate}T${time}:00+07:00` : null;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {data: auth} = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({error: 'กรุณาเข้าสู่ระบบก่อนบันทึกทริป'}, {status: 401});
  let payload: {title?: string; plan?: any};
  try {payload = await request.json();} catch {return NextResponse.json({error: 'ข้อมูล Plan ไม่ถูกต้อง'}, {status: 400});}
  if(!payload||typeof payload!=='object'||Array.isArray(payload))return NextResponse.json({error:'ข้อมูล Plan ไม่ถูกต้อง'},{status:400});
  const {title, plan} = payload;
  if(title!==undefined&&(typeof title!=='string'||title.trim().length>120))return NextResponse.json({error:'ชื่อทริปต้องไม่เกิน 120 ตัวอักษร'},{status:400});
  if (!plan || !Array.isArray(plan.days) || !plan.days.length) return NextResponse.json({error: 'ไม่พบกำหนดการรายวันจาก Planner'}, {status: 400});
  const startDate = typeof plan.startDate === 'string' ? plan.startDate : null;
  const endDate = typeof plan.endDate === 'string' ? plan.endDate : null;

  if (!validDate(startDate) || !validDate(endDate)) return NextResponse.json({error: 'โปรดเลือกวันเริ่มและวันสิ้นสุดก่อนบันทึกทริป เพื่อสร้างกำหนดการและตรวจสอบเวลาได้ถูกต้อง'}, {status: 400});
  const plannedDays = Math.floor((Date.parse(`${endDate}T00:00:00Z`) - Date.parse(`${startDate}T00:00:00Z`)) / 86400000) + 1;
  if (plannedDays < 1 || plannedDays>14 || plan.days.length !== plannedDays) return NextResponse.json({error: 'จำนวนวันในแผนไม่ตรงกับช่วงวันที่เลือก กรุณาสร้างแผนใหม่ก่อนบันทึก'}, {status: 400});
  if(plan.days.some((day:any)=>!day||typeof day!=='object'||!Array.isArray(day.items))||plan.itinerary!=null&&!Array.isArray(plan.itinerary))return NextResponse.json({error:'กำหนดการไม่ถูกต้อง'},{status:400});
  const allItems=plan.days.flatMap((day:any)=>Array.isArray(day.items)?day.items:[]);
  if(!allItems.length||allItems.length>100||!Number.isInteger(plan.travelers)||plan.travelers<1||plan.travelers>30||plan.days.some((day:any,i:number)=>day.day!==i+1||!Array.isArray(day.items)))return NextResponse.json({error:'รายการหรือจำนวนผู้เดินทางในแผนไม่ถูกต้อง'},{status:400});
  const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if(allItems.some((item:any)=>!item||typeof item!=='object'||!uuid.test(item.id)||!['place','event'].includes(item.kind)||item.cost!=null&&(!Number.isFinite(item.cost)||item.cost<0)||item.duration!=null&&(!Number.isFinite(item.duration)||item.duration<=0||item.duration>1440)))return NextResponse.json({error:'ข้อมูลรายการในแผนไม่ถูกต้อง'},{status:400});
  if(plan.budget!=null&&(!Number.isFinite(plan.budget)||plan.budget<0||plan.budget>1000000))return NextResponse.json({error:'งบประมาณไม่ถูกต้อง'},{status:400});
  // Recheck availability before writing: a published record may have been withdrawn since generation.
  for(const [kind,table] of [['place','places'],['event','events']]){
    const ids=[...new Set(allItems.filter((item:any)=>item.kind===kind).map((item:any)=>item.id))];if(!ids.length)continue;
    const {data:available,error:availabilityError}=await supabase.from(table).select('id').in('id',ids).eq('publication_status','published');
    if(availabilityError)return NextResponse.json({error:'ตรวจสอบรายการไม่สำเร็จ กรุณาลองใหม่'},{status:503});
    if(available?.length!==ids.length)return NextResponse.json({error:'บางรายการไม่เผยแพร่แล้ว กรุณาสร้างแผนใหม่'},{status:409});
  }
  const {data: tripId, error} = await supabase.rpc('create_trip_with_days', {trip_title: title || 'ทริปจาก GepPao Planner',trip_start_date: startDate,trip_end_date: endDate,trip_travelers: Number(plan.travelers) || 1,trip_budget_total: plan.budget == null ? null : Number(plan.budget),trip_preferences: {input: plan.input, planner_version: 'v2', trip_mode: plan.tripMode ?? 'overnight', family: plan.preferences?.family === true, pet: plan.preferences?.pet === true, vibes: Array.isArray(plan.preferences?.vibes) ? plan.preferences.vibes : []},trip_status: 'planned'});
  if (error) return NextResponse.json({error: 'บันทึกทริปไม่สำเร็จ กรุณาลองใหม่'}, {status: 500});
  const {data: days, error: daysError} = await supabase.from('trip_days').select('id,day_number,service_date').eq('trip_id', tripId).order('day_number');
  if (daysError) return NextResponse.json({error:'สร้างทริปแล้ว แต่โหลดวันเดินทางไม่สำเร็จ กรุณาเปิดทริปเพื่อตรวจสอบ',tripId}, {status: 500});
  if(days?.length!==plannedDays)return NextResponse.json({error:'สร้างทริปแล้ว แต่จำนวนวันไม่ครบ กรุณาเปิดทริปเพื่อตรวจสอบ',tripId},{status:500});
  const itineraryByKey = new Map<string, any>();for (const item of plan.itinerary ?? []) if(item&&typeof item==='object') itineraryByKey.set(`${item.day}:${item.id}`, item);
  const rows = plan.days.flatMap((day:any) => {const tripDay = days?.find((value:any) => value.day_number === day.day);if (!tripDay) return [];return (day.items ?? []).map((item:any, index:number) => {const itinerary = itineraryByKey.get(`${day.day}:${item.id}`);const safeTime=typeof itinerary?.startTime==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(itinerary.startTime)?itinerary.startTime:null;const startsAt = toIso(tripDay.service_date, safeTime);const duration = Number(item.duration);const endsAt = startsAt && Number.isFinite(duration) && duration > 0 ? new Date(new Date(startsAt).getTime() + duration * 60000).toISOString() : null;return {trip_day_id: tripDay.id,place_id: item.kind === 'place' ? item.id : null,event_id: item.kind === 'event' ? item.id : null,position: index*1024,starts_at: startsAt,ends_at: endsAt,duration_minutes: Number.isFinite(duration) && duration > 0 ? duration : null,estimated_cost: item.cost == null ? null : Number(item.cost),recommendation_reason: item.reason || null};});});
  if (rows.length) {const {error: itemError} = await supabase.from('trip_items').insert(rows);if (itemError) return NextResponse.json({error:'สร้างทริปแล้ว แต่เพิ่มรายการไม่ครบ กรุณาเปิดทริปเพื่อตรวจสอบ', tripId}, {status: 500});}
  try {
    const recalculate=await recalculateTrip(request,{params:Promise.resolve({id:String(tripId)})});
    const calculation=await recalculate.json();
    if(!recalculate.ok)return NextResponse.json({id:tripId,warning:'บันทึกแล้ว แต่ยังคำนวณเวลาไม่สำเร็จ กรุณากดคำนวณใหม่ในทริป'},{status:201});
    return NextResponse.json({id:tripId,calculation},{status:201});
  } catch {
    return NextResponse.json({id:tripId,warning:'บันทึกแล้ว กรุณาตรวจสอบและคำนวณใหม่ในทริป'},{status:201});
  }
}
