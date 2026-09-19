import {NextResponse} from 'next/server';
import {createClient} from '@/lib/supabase/server';

type PriceStatus = 'missing' | 'estimated' | 'confirmed';

const number = (value: string, pattern: RegExp) => {
  const match = value.match(pattern);
  return match ? Number(match[1].replace(/,/g, '')) : undefined;
};

const priceOf = (items: any[]): {cost: number | null; status: PriceStatus} => {
  const price = items?.[0];
  if (!price || price.amount_min == null) return {cost: null, status: 'missing'};
  return {
    cost: Number(price.amount_min),
    status: price.is_estimate ? 'estimated' : 'confirmed',
  };
};

export async function POST(request: Request) {
  const {input, startDate, endDate} = await request.json();
  const text = String(input || '').trim();
  if (!text) return NextResponse.json({error: 'กรุณาระบุความต้องการของทริป'}, {status: 400});

  const travelers = number(text, /(\d+)\s*(?:คน|ท่าน)/i) || 2;
  const budget = number(text, /(?:งบ|budget)[^\d]*(\d[\d,]*)/i);
  const supabase = await createClient();
  let placeQuery = supabase
    .from('places')
    .select('id,name,slug,place_type,address,max_group_size,pet_friendly,child_friendly,parking_available,recommended_duration_minutes,place_hours(day_of_week,open_time,close_time,is_closed),price_items(amount_min,currency,price_unit,is_estimate)')
    .eq('publication_status', 'published');
  if (travelers) placeQuery = placeQuery.or(`max_group_size.is.null,max_group_size.gte.${travelers}`);

  const eventQuery = supabase
    .from('events')
    .select('id,name,slug,address,temporary_venue_name,event_schedules(starts_at,ends_at,status),price_items(amount_min,currency,price_unit,is_estimate)')
    .eq('publication_status', 'published');
  const [{data: places, error}, {data: events}] = await Promise.all([placeQuery, eventQuery]);
  if (error) return NextResponse.json({error: error.message}, {status: 500});

  const pet = /หมา|แมว|สัตว์เลี้ยง|pet/i.test(text);
  const family = /ครอบครัว|เด็ก|family/i.test(text);
  const scored = (places ?? []).map((place: any) => {
    const price = priceOf(place.price_items ?? []);
    return {
      kind: 'place',
      id: place.id,
      name: place.name,
      slug: place.slug,
      type: place.place_type,
      location: place.address,
      cost: price.cost,
      priceStatus: price.status,
      duration: place.recommended_duration_minutes ?? null,
      score: (pet && place.pet_friendly ? 3 : 0)
        + (family && place.child_friendly ? 3 : 0)
        + (place.place_hours?.length ? 1 : 0)
        + (place.price_items?.length ? 1 : 0),
      reason: [
        pet && place.pet_friendly ? 'รองรับสัตว์เลี้ยง' : '',
        family && place.child_friendly ? 'เหมาะกับครอบครัว' : '',
        place.place_hours?.length ? 'มีเวลาเปิด–ปิดที่ตรวจสอบได้' : '',
      ].filter(Boolean).join(' · ') || 'ข้อมูลตรงกับเงื่อนไขพื้นฐาน',
    };
  }).sort((a, b) => b.score - a.score);

  const eventItems = (events ?? [])
    .filter((event: any) => event.event_schedules?.some((schedule: any) => (
      schedule.status === 'scheduled'
      && (!startDate || schedule.starts_at >= startDate)
      && (!endDate || schedule.starts_at <= `${endDate}T23:59:59+07:00`)
    )))
    .map((event: any) => {
      const price = priceOf(event.price_items ?? []);
      return {
        kind: 'event',
        id: event.id,
        name: event.name,
        slug: event.slug,
        type: 'event',
        location: event.temporary_venue_name || event.address,
        cost: price.cost,
        priceStatus: price.status,
        duration: null,
        score: 2,
        reason: 'Event ที่เผยแพร่และมีรอบตรงกับช่วงเดินทาง',
      };
    });

  const selected = [
    ...scored.filter((item) => item.type === 'accommodation').slice(0, 1),
    ...scored.filter((item) => item.type !== 'accommodation').slice(0, 5),
    ...eventItems.slice(0, 2),
  ];
  const total = selected.reduce((sum, item) => sum + (item.cost ?? 0), 0);
  const missingPriceCount = selected.filter((item) => item.cost == null).length;
  const missingDurationCount = selected.filter((item) => item.duration == null).length;

  return NextResponse.json({
    plan: {
      input: text,
      travelers,
      budget: budget ?? null,
      startDate: startDate || null,
      endDate: endDate || null,
      totalEstimatedCost: total,
      costCoverage: missingPriceCount === 0 ? 'complete' : total > 0 ? 'partial' : 'missing',
      items: selected,
      limitations: [
        'เส้นทางยังเป็น Estimate และยังไม่คำนวณเวลาเดินทางจริง',
        missingPriceCount ? 'บางรายการยังไม่มีราคา จึงไม่รวมในยอดประมาณการ' : '',
        missingDurationCount ? 'บางรายการยังไม่มี Recommended Duration' : '',
        'ตรวจสอบราคาและเวลาอีกครั้งก่อนเดินทาง',
      ].filter(Boolean),
    },
  });
}
