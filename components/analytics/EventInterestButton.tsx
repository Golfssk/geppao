'use client';

import {useState} from 'react';
import {trackProductEvent} from '@/lib/analytics/client';

export function EventInterestButton({eventId}: {eventId: string}) {
  const [recorded, setRecorded] = useState(false);
  return <button className="btn btn-sage" disabled={recorded} onClick={() => {
    setRecorded(true);
    void trackProductEvent({eventName: 'event_interest', eventId});
  }}>{recorded ? 'บันทึกความสนใจแล้ว' : 'สนใจ Event นี้'}</button>;
}
