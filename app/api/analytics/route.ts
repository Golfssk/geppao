import {NextResponse} from 'next/server';
import {createClient} from '@/lib/supabase/server';

const EVENT_NAMES = new Set([
  'search', 'planner_run', 'planner_recommendation', 'trip_created',
  'add_to_trip', 'remove_from_trip', 'lock_item', 'unlock_item',
  'trip_recalculated', 'place_view', 'google_maps_opened', 'trip_shared',
  'contact_clicked', 'event_interest',
]);
const SOURCES = new Set(['web', 'shared_trip', 'admin', 'business']);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const optionalUuid = (value: unknown) => value == null || value === '' || (typeof value === 'string' && UUID.test(value));

export async function POST(request: Request) {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({error: 'Invalid JSON body'}, {status: 400});
  }

  if (!EVENT_NAMES.has(body?.eventName)) {
    return NextResponse.json({error: 'Unsupported analytics event'}, {status: 400});
  }
  if (body.source != null && !SOURCES.has(body.source)) {
    return NextResponse.json({error: 'Unsupported analytics source'}, {status: 400});
  }
  if (![body.sessionId, body.tripId, body.shareToken, body.placeId, body.eventId].every(optionalUuid)) {
    return NextResponse.json({error: 'Invalid analytics reference'}, {status: 400});
  }
  if (body.path != null && (typeof body.path !== 'string' || body.path.length > 500)) {
    return NextResponse.json({error: 'Invalid analytics path'}, {status: 400});
  }
  if (body.metadata != null && (typeof body.metadata !== 'object' || Array.isArray(body.metadata))) {
    return NextResponse.json({error: 'Invalid analytics metadata'}, {status: 400});
  }

  const supabase = await createClient();
  const {error} = await supabase.rpc('track_product_event', {
    requested_event_name: body.eventName,
    requested_anonymous_session_id: body.sessionId || null,
    target_trip_id: body.tripId || null,
    target_share_token: body.shareToken || null,
    target_place_id: body.placeId || null,
    target_event_id: body.eventId || null,
    requested_source: body.source || 'web',
    requested_path: body.path || null,
    requested_metadata: body.metadata || {},
  });

  if (error) return NextResponse.json({error: error.message}, {status: 400});
  return NextResponse.json({accepted: true}, {status: 202});
}
