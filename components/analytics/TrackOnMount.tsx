'use client';

import {useEffect, useRef} from 'react';
import {trackProductEvent, type ProductEventName} from '@/lib/analytics/client';

export function TrackOnMount({
  eventName,
  placeId,
  eventId,
  metadata,
}: {
  eventName: ProductEventName;
  placeId?: string;
  eventId?: string;
  metadata?: Record<string, string | number | boolean | null>;
}) {
  const tracked = useRef(false);
  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    void trackProductEvent({eventName, placeId, eventId, metadata});
  }, [eventName, placeId, eventId, metadata]);
  return null;
}
