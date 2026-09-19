import {redirect} from 'next/navigation';
import {createClient} from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

type QualityRow = {
  id: string;
  name: string;
  kind: 'Place' | 'Event';
  type: string;
  publicationStatus: string;
  verificationStatus: string;
  score: number;
  missing: string[];
};

const hasCover = (images: Array<{is_cover?: boolean}> | null | undefined) =>
  Boolean(images?.some((image) => image.is_cover));

export default async function Quality() {
  const supabase = await createClient();
  const {data: auth} = await supabase.auth.getUser();
  if (!auth.user) redirect('/host/login');

  const {data: admin} = await supabase
    .from('admin_users')
    .select('role')
    .eq('user_id', auth.user.id)
    .maybeSingle();
  if (!admin) redirect('/');

  const [{data: places}, {data: events}] = await Promise.all([
    supabase
      .from('places')
      .select('id,name,place_type,publication_status,verification_status,description,address,latitude,longitude,recommended_duration_minutes,last_verified_at,place_images(id,is_cover),place_hours(id),price_items(id),place_sources(id)')
      .neq('publication_status', 'archived')
      .order('name'),
    supabase
      .from('events')
      .select('id,name,publication_status,verification_status,description,address,latitude,longitude,last_verified_at,event_images(id,is_cover),event_schedules(id,status),price_items(id)')
      .neq('publication_status', 'archived')
      .order('name'),
  ]);

  const placeRows: QualityRow[] = (places ?? []).map((place: any) => {
    const checks = [
      Boolean(place.description),
      Boolean(place.address),
      place.latitude != null && place.longitude != null,
      hasCover(place.place_images),
      (place.place_hours?.length ?? 0) > 0,
      (place.price_items?.length ?? 0) > 0,
      (place.place_sources?.length ?? 0) > 0,
      place.recommended_duration_minutes != null,
      place.verification_status === 'verified' && Boolean(place.last_verified_at),
    ];
    return {
      id: place.id,
      name: place.name,
      kind: 'Place',
      type: place.place_type,
      publicationStatus: place.publication_status,
      verificationStatus: place.verification_status,
      score: Math.round((checks.filter(Boolean).length / checks.length) * 100),
      missing: ['คำอธิบาย', 'ที่อยู่', 'พิกัด', 'รูปปก', 'เวลา', 'ราคา', 'แหล่งที่มา', 'Recommended Duration', 'การยืนยันล่าสุด']
        .filter((_, index) => !checks[index]),
    };
  });

  const eventRows: QualityRow[] = (events ?? []).map((event: any) => {
    const availableSchedule = event.event_schedules?.some((schedule: any) => schedule.status === 'scheduled');
    const checks = [
      Boolean(event.description),
      Boolean(event.address) || (event.latitude != null && event.longitude != null),
      event.latitude != null && event.longitude != null,
      hasCover(event.event_images),
      availableSchedule,
      (event.price_items?.length ?? 0) > 0,
      event.verification_status === 'verified' && Boolean(event.last_verified_at),
    ];
    return {
      id: event.id,
      name: event.name,
      kind: 'Event',
      type: 'event',
      publicationStatus: event.publication_status,
      verificationStatus: event.verification_status,
      score: Math.round((checks.filter(Boolean).length / checks.length) * 100),
      missing: ['คำอธิบาย', 'สถานที่', 'พิกัด', 'รูปปก', 'รอบที่เปิด', 'ราคา', 'การยืนยันล่าสุด']
        .filter((_, index) => !checks[index]),
    };
  });

  const rows = [...placeRows, ...eventRows];
  const coverage = rows.reduce<Record<string, number>>((summary, row) => {
    const key = row.kind === 'Event' ? 'Event' : row.type;
    summary[key] = (summary[key] ?? 0) + 1;
    return summary;
  }, {});

  return (
    <main className="page">
      <div className="container section">
        <p className="eyebrow">DATA QUALITY</p>
        <h1>Local Data completeness</h1>
        <p className="muted">ตรวจข้อมูลก่อนอนุมัติและก่อนนำเข้า Planner</p>
        <section className="dashboard-card">
          <h2>Pilot coverage</h2>
          <p className="muted">{rows.length} รายการในระบบ · {placeRows.length} Places · {eventRows.length} Events</p>
          <div className="form-grid">
            {Object.entries(coverage).map(([key, count]) => <strong key={key}>{key}: {count}</strong>)}
          </div>
        </section>
        <div className="review-grid">
          {rows.map((row) => (
            <article className="review-card" key={`${row.kind}-${row.id}`}>
              <div className="section-head">
                <div>
                  <h2>{row.name}</h2>
                  <p className="muted">{row.kind} · {row.type} · {row.publicationStatus} · {row.verificationStatus}</p>
                </div>
                <strong>{row.score}%</strong>
              </div>
              <p>{row.missing.length ? `ขาด: ${row.missing.join(', ')}` : 'ข้อมูลพร้อมสำหรับการตรวจขั้นถัดไป'}</p>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
