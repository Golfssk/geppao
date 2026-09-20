export type ProductEventName =
  | 'search'
  | 'planner_run'
  | 'planner_recommendation'
  | 'trip_created'
  | 'add_to_trip'
  | 'remove_from_trip'
  | 'lock_item'
  | 'unlock_item'
  | 'trip_recalculated'
  | 'place_view'
  | 'google_maps_opened'
  | 'trip_shared'
  | 'contact_clicked'
  | 'event_interest';

type ProductEvent = {
  eventName: ProductEventName;
  tripId?: string;
  shareToken?: string;
  placeId?: string;
  eventId?: string;
  source?: 'web' | 'shared_trip' | 'admin' | 'business';
  path?: string;
  metadata?: Record<string, string | number | boolean | null | undefined>;
};

const SESSION_KEY = 'geppao.analytics.session';

function sessionId() {
  if (typeof window === 'undefined') return undefined;
  try {
    const existing = window.localStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const created = window.crypto.randomUUID();
    window.localStorage.setItem(SESSION_KEY, created);
    return created;
  } catch {
    return window.crypto.randomUUID();
  }
}

export async function trackProductEvent(event: ProductEvent) {
  if (typeof window === 'undefined') return;
  try {
    await fetch('/api/analytics', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      keepalive: true,
      body: JSON.stringify({
        ...event,
        sessionId: sessionId(),
        path: event.path ?? window.location.pathname,
      }),
    });
  } catch {
    // Analytics must never block the traveler workflow.
  }
}
