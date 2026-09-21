import {NextResponse} from 'next/server';
import {createClient} from '@/lib/supabase/server';

const toIso = (serviceDate:string | null, time:string | null) => serviceDate && time ? `${serviceDate}T${time}:00+07:00` : null;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {data: auth} = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({error: 'กรุณาเข้าสู่ระบบก่อนบันทึกทริป'}, {status: 401});
  let payload: {title?: string; plan?: any};
  try {payload = await request.json();} catch {return NextResponse.json({error: 'ข้อมูล Plan ไม่ถูกต้อง'}, {status: 400});}
  const {title, plan} = payload;
  if (!plan || !Array.isArray(plan.days) || !plan.days.length) return NextResponse.json({error: 'ไม่พบกำหนดการรายวันจาก Planner'}, {status: 400});
  const startDate = typeof plan.startDate === 'string' ? plan.startDate : null;
  const endDate = typeof plan.endDate === 'string' ? plan.endDate : null;
  const validDate = (value: string | null) => Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)));
  if (!validDate(startDate) || !validDate(endDate)) return NextResponse.json({error: 'โปรดเลือกวันเริ่มและวันสิ้นสุดก่อนบันทึกทริป เพื่อสร้างกำหนดการและตรวจสอบเวลาได้ถูกต้อง'}, {status: 400});
  const plannedDays = Math.floor((Date.parse(`${endDate}T00:00:00Z`) - Date.parse(`${startDate}T00:00:00Z`)) / 86400000) + 1;
  if (plannedDays < 1 || plan.days.length !== plannedDays) return NextResponse.json({error: 'จำนวนวันในแผนไม่ตรงกับช่วงวันที่เลือก กรุณาสร้างแผนใหม่ก่อนบันทึก'}, {status: 400});
  const {data: tripId, error} = await supabase.rpc('create_trip_with_days', {trip_title: title || 'ทริปจาก GepPao Planner',trip_start_date: startDate,trip_end_date: endDate,trip_travelers: Number(plan.travelers) || 1,trip_budget_total: plan.budget == null ? null : Number(plan.budget),trip_preferences: {input: plan.input, planner_version: 'v2', trip_mode: plan.tripMode ?? 'overnight', family: plan.preferences?.family === true, pet: plan.preferences?.pet === true, vibes: Array.isArray(plan.preferences?.vibes) ? plan.preferences.vibes : []},trip_status: 'planned'});
  if (error) return NextResponse.json({error: error.message}, {status: 500});
  const {data: days, error: daysError} = await supabase.from('trip_days').select('id,day_number,service_date').eq('trip_id', tripId).order('day_number');
  if (daysError) return NextResponse.json({error: daysError.message}, {status: 500});
  const itineraryByKey = new Map<string, any>();for (const item of plan.itinerary ?? []) itineraryByKey.set(`${item.day}:${item.name}`, item);
  const rows = plan.days.flatMap((day:any) => {const tripDay = days?.find((value:any) => value.day_number === day.day);if (!tripDay) return [];return (day.items ?? []).map((item:any, index:number) => {const itinerary = itineraryByKey.get(`${day.day}:${item.name}`);const startsAt = toIso(tripDay.service_date, itinerary?.startTime || null);const duration = Number(item.duration);const endsAt = startsAt && Number.isFinite(duration) && duration > 0 ? new Date(new Date(startsAt).getTime() + duration * 60000).toISOString() : null;return {trip_day_id: tripDay.id,place_id: item.kind === 'place' ? item.id : null,event_id: item.kind === 'event' ? item.id : null,position: index,starts_at: startsAt,ends_at: endsAt,duration_minutes: Number.isFinite(duration) && duration > 0 ? duration : null,estimated_cost: item.cost == null ? null : Number(item.cost),recommendation_reason: item.reason || null};});});
  if (rows.length) {const {error: itemError} = await supabase.from('trip_items').insert(rows);if (itemError) return NextResponse.json({error: itemError.message, tripId}, {status: 500});}
  const recalculate = await fetch(new URL(`/api/trips/${tripId}/recalculate`, request.url), {method: 'POST',headers: {cookie: request.headers.get('cookie') || ''}});
  const calculation = await recalculate.json();
  if (!recalculate.ok) return NextResponse.json({error: calculation.error || 'สร้างทริปสำเร็จ แต่คำนวณ Trip Intelligence ไม่สำเร็จ', tripId}, {status: 201});
  return NextResponse.json({id: tripId, calculation}, {status: 201});
}
