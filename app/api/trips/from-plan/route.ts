import {NextResponse} from 'next/server';
import {createClient} from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  const {data: auth} = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({error: 'กรุณาเข้าสู่ระบบก่อนบันทึกทริป'}, {status: 401});

  const {title, plan} = await request.json();
  const {data: tripId, error} = await supabase.rpc('create_trip_with_days', {
    trip_title: title || 'ทริปจาก GepPao Planner',
    trip_start_date: plan.startDate || null,
    trip_end_date: plan.endDate || null,
    trip_travelers: Number(plan.travelers) || 1,
    trip_budget_total: plan.budget == null ? null : Number(plan.budget),
    trip_preferences: {input: plan.input},
    trip_status: 'planned',
  });
  if (error) return NextResponse.json({error: error.message}, {status: 500});

  const {data: days, error: daysError} = await supabase
    .from('trip_days')
    .select('id,day_number')
    .eq('trip_id', tripId)
    .order('day_number');
  if (daysError) return NextResponse.json({error: daysError.message}, {status: 500});

  if (days?.length) {
    const rows = (plan.items ?? []).map((item: any, index: number) => ({
      trip_day_id: days[index % days.length].id,
      place_id: item.kind === 'place' ? item.id : null,
      event_id: item.kind === 'event' ? item.id : null,
      position: index,
      estimated_cost: item.cost == null ? null : Number(item.cost),
      recommendation_reason: item.reason || null,
    }));
    if (rows.length) {
      const {error: itemError} = await supabase.from('trip_items').insert(rows);
      if (itemError) return NextResponse.json({error: itemError.message, tripId}, {status: 500});
    }
  }

  return NextResponse.json({id: tripId}, {status: 201});
}
