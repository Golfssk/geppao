'use client';

import {useState} from 'react';
import {trackProductEvent} from '@/lib/analytics/client';

export function EventInterestButton({eventId,label="สนใจ Event นี้",recordedLabel="บันทึกความสนใจแล้ว"}: {eventId: string;label?:string;recordedLabel?:string}) {
  const [recorded, setRecorded] = useState(false);
  return <button className="btn btn-sage" disabled={recorded} onClick={() => {
    setRecorded(true);
    void trackProductEvent({eventName: 'event_interest', eventId});
  }}>{recorded ? recordedLabel : label}</button>;
}
