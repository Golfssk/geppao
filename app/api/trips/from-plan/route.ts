import {NextResponse} from 'next/server';
import {createClient} from '@/lib/supabase/server';

const toIso = (serviceDate:string | null, time:string | null) =>
  serviceDate && time ? `${serviceDate}T${time}:00+07:00` : null;

const dateForDay = (startDate:string | null, dayNumber:number) => {
  if (!startDate) return null;
  const date = new Date(`${startDate}T00:00:00+07:00`);
  date.setDate(date.getDate() + dayNumber - 1);
  return date.toLocaleDateString('en-CA', {timeZone:'Asia/Bangkok'});
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const {data: auth} = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({error: 'กรุณาเข้าสู่ระบบก่อนบันทึกทริป'}, {status: 401});

  const {title, plan} = await request.json();
  if (!plan) return NextResponse.json({error: 'ไม่พบข้อมูล Plan'}, {status: 400});

  const {data: tripId, error} = await supabase.rpc('create_trip_with_days', {
    trip_title: title || 'ทริปจาก GepPao Planner',
    trip_start_date: plan.startDate || null,
    trip_end_date: plan.endDate || null,
    trip_travelers: Number(plan.travelers) || 1,
    trip_budget_total: plan.budget == null ? null : Number(plan.budget),
    trip_preferences: {input: plan.input, planner_version: 'v2'},
    trip_status: 'planned',
  });
  if (error) return NextResponse.json({error: error.message}, {status: 500});

  const {data: days, error: daysError} = await supabase
    .from('trip_days')
    .select('id,day_number,service_date')
    .eq('trip_id', tripId)
    .order('day_number');
  if (daysError) return NextResponse.json({error: daysError.message}, {status: 500});

  const itineraryByKey = new Map<string, any>();
  for (const item of plan.itinerary ?? []) {
    itineraryByKey.set(`${item.day}:${item.name}`, item);
  }

  const rows = (plan.days ?? []).flatMap((day:any) => {
    const tripDay = days?.find((value:any) => value.day_number === day.day);
    if (!tripDay) return [];
    return (day.items ?? []).map((item:any, index:number) => {
      const itinerary = itineraryByKey.get(`${day.day}:${item.name}`);
      const startsAt = toIso(tripDay.service_date || dateForDay(plan.startDate || null, day.day), itinerary?.startTime || null);
      const duration = Number(item.duration);
      const endsAt = startsAt && Number.isFinite(duration) && duration > 0
        ? new Date(new Date(startsAt).getTime() + duration * 60000).toISOString()
        : null;
      return {
        trip_day_id: tripDay.id,
        place_id: item.kind === 'place' ? item.id : null,
        event_id: item.kind === 'event' ? item.id : null,
        position: index,
        starts_at: startsAt,
        ends_at: endsAt,
        duration_minutes: Number.isFinite(duration) && duration > 0 ? duration : null,
        estimated_cost: item.cost == null ? null : Number(item.cost),
        recommendation_reason: item.reason || null,
      };
    });
  });

  if (rows.length) {
    const {error: itemError} = await supabase.from('trip_items').insert(rows);
    if (itemError) return NextResponse.json({error: itemError.message, tripId}, {status: 500});
  }

  const recalculate = await fetch(new URL(`/api/trips/${tripId}/recalculate`, request.url), {
    method: 'POST',
    headers: {cookie: request.headers.get('cookie') || ''},
  });
  const calculation = await recalculate.json();
  if (!recalculate.ok) {
    return NextResponse.json({error: calculation.error || 'สร้างทริปสำเร็จ แต่คำนวณ Trip Intelligence ไม่สำเร็จ', tripId}, {status: 201});
  }

  return NextResponse.json({id: tripId, calculation}, {status: 201});
}
