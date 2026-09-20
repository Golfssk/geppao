'use client';

import type {ReactNode} from 'react';
import {trackProductEvent, type ProductEventName} from '@/lib/analytics/client';

export function TrackedLink({
  href,
  children,
  className,
  eventName,
  tripId,
  placeId,
  eventId,
  target,
}: {
  href: string;
  children: ReactNode;
  className?: string;
  eventName: ProductEventName;
  tripId?: string;
  placeId?: string;
  eventId?: string;
  target?: string;
}) {
  return <a href={href} className={className} target={target} rel={target === '_blank' ? 'noreferrer' : undefined}
    onClick={() => void trackProductEvent({eventName, tripId, placeId, eventId})}>{children}</a>;
}
