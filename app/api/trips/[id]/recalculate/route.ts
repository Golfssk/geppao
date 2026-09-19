import {NextResponse} from 'next/server';
import {createClient} from '@/lib/supabase/server';
import {calculateTripDay, type CalculationItemInput} from '@/lib/trip-intelligence';

type RouteContext = {params: Promise<{id: string}>};

const asPositiveInteger = (value: unknown, fallback: number): number => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const nightsBetween = (start: string | null, end: string | null): number | null => {
  if (!start || !end) return null;
  const startTime = new Date(`${start}T00:00:00+07:00`).getTime();
  const endTime = new Date(`${end}T00:00:00+07:00`).getTime();
  const nights = Math.round((endTime - startTime) / 86400000);
  return nights > 0 ? nights : null;
};

export async function POST(_: Request, {params}: RouteContext) {
  const {id} = await params;
  const supabase = await createClient();
  const {data: auth} = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({error: 'กรุณาเข้าสู่ระบบ'}, {status: 401});

  const {data: canEdit, error: permissionError} = await supabase.rpc('can_edit_trip', {target_trip_id: id});
  if (permissionError) return NextResponse.json({error: permissionError.message}, {status: 500});
  if (!canEdit) return NextResponse.json({error: 'คุณไม่มีสิทธิ์แก้ไขทริปนี้'}, {status: 403});

  const {data: trip, error: tripError} = await supabase
    .from('trips')
    .select('id,travelers,start_date,end_date,preferences')
    .eq('id', id)
    .maybeSingle();
  if (tripError) return NextResponse.json({error: tripError.message}, {status: 500});
  if (!trip) return NextResponse.json({error: 'ไม่พบทริป'}, {status: 404});

  const {data: days, error: daysError} = await supabase
    .from('trip_days')
    .select('id,day_number,service_date')
    .eq('trip_id', id)
    .order('day_number');
  if (daysError) return NextResponse.json({error: daysError.message}, {status: 500});

  const dayIds = (days ?? []).map((day) => day.id);
  if (!dayIds.length) return NextResponse.json({tripId: id, days: []});

  const {data: rawItems, error: itemsError} = await supabase
    .from('trip_items')
    .select(`id,trip_day_id,position,starts_at,ends_at,estimated_cost,duration_minutes,is_locked,
      place:places(id,name,latitude,longitude,publication_status,recommended_duration_minutes,
        place_hours(day_of_week,open_time,close_time,is_closed,crosses_midnight),
        place_special_hours(service_date,open_time,close_time,is_closed),
        price_items(amount_min,price_unit,is_estimate)),
      event:events(id,name,latitude,longitude,publication_status,
        event_schedules(starts_at,ends_at,status),price_items(amount_min,price_unit,is_estimate))`)
    .in('trip_day_id', dayIds)
    .order('position');
  if (itemsError) return NextResponse.json({error: itemsError.message}, {status: 500});

  const preferences = (trip.preferences ?? {}) as Record<string, unknown>;
  const rooms = Number.isInteger(Number(preferences.rooms)) && Number(preferences.rooms) > 0
    ? Number(preferences.rooms)
    : null;
  const nights = nightsBetween(trip.start_date, trip.end_date);
  const results = [];

  for (const day of days ?? []) {
    const items = ((rawItems ?? []).filter((item) => item.trip_day_id === day.id) as CalculationItemInput[]);
    const calculation = calculateTripDay(items, {
      serviceDate: day.service_date,
      travelers: asPositiveInteger(trip.travelers, 1),
      nights,
      rooms,
    });

    for (const item of calculation.items) {
      const {error} = await supabase
        .from('trip_items')
        .update({
          duration_minutes: item.durationMinutes,
          travel_distance_km: item.travelDistanceKm,
          travel_duration_minutes: item.travelDurationMinutes,
          estimated_cost: item.estimatedCost,
          validation_status: item.validationStatus,
          validation_messages: item.validationMessages,
        })
        .eq('id', item.itemId)
        .eq('trip_day_id', day.id);
      if (error) return NextResponse.json({error: error.message}, {status: 500});
    }

    const {error: deleteRouteError} = await supabase
      .from('route_segments')
      .delete()
      .eq('trip_day_id', day.id);
    if (deleteRouteError) return NextResponse.json({error: deleteRouteError.message}, {status: 500});

    if (calculation.routeSegments.length) {
      const {error: routeError} = await supabase.from('route_segments').insert(
        calculation.routeSegments.map((segment) => ({
          trip_day_id: day.id,
          from_item_id: segment.fromItemId,
          to_item_id: segment.toItemId,
          travel_mode: 'driving',
          distance_km: segment.distanceKm,
          duration_minutes: segment.durationMinutes,
          provider: segment.provider,
          confidence: segment.confidence,
        })),
      );
      if (routeError) return NextResponse.json({error: routeError.message}, {status: 500});
    }

    const {data: summary, error: summaryError} = await supabase.rpc('refresh_trip_day_summary', {
      target_trip_day_id: day.id,
    });
    if (summaryError) return NextResponse.json({error: summaryError.message}, {status: 500});

    results.push({
      dayId: day.id,
      dayNumber: day.day_number,
      serviceDate: day.service_date,
      summary,
      costCoverage: calculation.costCoverage,
      missingPriceCount: calculation.missingPriceCount,
      items: calculation.items,
      routeSegments: calculation.routeSegments,
    });
  }

  return NextResponse.json({tripId: id, calculatedAt: new Date().toISOString(), days: results});
}
