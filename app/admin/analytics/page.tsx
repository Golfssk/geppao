import {redirect} from 'next/navigation';
import {getAdminContext} from '@/lib/admin-access';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type AnalyticsRow = {
  event_name: string;
  occurred_at: string;
  actor_user_id: string | null;
  anonymous_session_id: string | null;
  place_id: string | null;
  places: Array<{name: string}> | null;
};

const WINDOW_DAYS = 30;

export default async function AnalyticsPage() {
  const {supabase, user, admin} = await getAdminContext();
  if (!user) redirect('/host/login');
  if (!admin) redirect('/');

  const from = new Date(Date.now() - WINDOW_DAYS * 86_400_000).toISOString();
  const {data, error} = await supabase
    .from('product_analytics_events')
    .select('event_name,occurred_at,actor_user_id,anonymous_session_id,place_id,places(name)')
    .gte('occurred_at', from)
    .order('occurred_at', {ascending: true})
    .limit(5000);

  if (error) {
    return <main className="page"><div className="container section">
      <h1>Pilot Analytics</h1>
      <div className="setup-notice">{error.message}</div>
    </div></main>;
  }

  const rows = (data ?? []) as AnalyticsRow[];
  const eventCounts = rows.reduce<Record<string, number>>((counts, row) => {
    counts[row.event_name] = (counts[row.event_name] ?? 0) + 1;
    return counts;
  }, {});
  const uniqueActors = new Set(rows.map(row => row.actor_user_id ?? row.anonymous_session_id).filter(Boolean)).size;
  const dailyMap = rows.reduce<Record<string, {events: number; actors: Set<string>}>>((days, row) => {
    const date = row.occurred_at.slice(0, 10);
    const day = days[date] ?? {events: 0, actors: new Set<string>()};
    day.events += 1;
    const actor = row.actor_user_id ?? row.anonymous_session_id;
    if (actor) day.actors.add(actor);
    days[date] = day;
    return days;
  }, {});
  const daily = Object.entries(dailyMap).map(([date, value]) => ({
    date,
    events: value.events,
    uniqueActors: value.actors.size,
  }));
  const placeMap = rows.reduce<Record<string, {name: string; engagements: number}>>((places, row) => {
    if (!row.place_id) return places;
    const name = row.places?.[0]?.name ?? 'Unknown Place';
    const place = places[row.place_id] ?? {name, engagements: 0};
    place.engagements += 1;
    places[row.place_id] = place;
    return places;
  }, {});
  const topPlaces = Object.entries(placeMap)
    .map(([placeId, value]) => ({placeId, ...value}))
    .sort((a, b) => b.engagements - a.engagements || a.name.localeCompare(b.name, 'th'))
    .slice(0, 10);
  const plannerRuns = eventCounts.planner_run ?? 0;
  const tripsCreated = eventCounts.trip_created ?? 0;
  const plannerToTripPercent = plannerRuns ? Math.round(tripsCreated / plannerRuns * 1000) / 10 : 0;
  const maxDaily = Math.max(1, ...daily.map(day => day.events));

  const totals: Array<[string, string | number]> = [
    ['Events', rows.length],
    ['ผู้ใช้/Session', uniqueActors],
    ['Search', eventCounts.search ?? 0],
    ['Planner runs', plannerRuns],
    ['Trips created', tripsCreated],
    ['เปิด Navigation', eventCounts.google_maps_opened ?? 0],
    ['แชร์ Trip', eventCounts.trip_shared ?? 0],
    ['Planner → Trip', `${plannerToTripPercent}%`],
  ];

  return <main className="page"><div className="container section">
    <p className="eyebrow">PHASE 19 · LAST {WINDOW_DAYS} DAYS</p>
    <h1>Pilot Analytics</h1>
    <p className="muted">ข้อมูล First-party แบบไม่เก็บข้อความ Search หรือ Planner ดิบ · อ่านจาก Event rows โดยตรง</p>
    {rows.length >= 5000 && <div className="setup-notice">แสดงข้อมูลล่าสุดสูงสุด 5,000 Events</div>}
    <div className="dashboard-grid" style={{marginTop: 24}}>
      {totals.map(([label, value]) => <div className="stat" key={label}>
        <div className="muted">{label}</div><div className="stat-value">{value}</div>
      </div>)}
    </div>
    <section className="dashboard-card" style={{marginTop: 24}}>
      <h2>กิจกรรมรายวัน</h2>
      {daily.length ? <div style={{display: 'flex', alignItems: 'end', gap: 8, minHeight: 220, overflowX: 'auto'}}>
        {daily.map(day => <div key={day.date} title={`${day.date}: ${day.events} events`} style={{minWidth: 34, textAlign: 'center'}}>
          <div style={{height: `${Math.max(8, day.events / maxDaily * 170)}px`, background: 'var(--sage)', borderRadius: '8px 8px 0 0'}} />
          <small>{new Date(day.date).toLocaleDateString('th-TH', {day: '2-digit', month: '2-digit'})}</small>
        </div>)}
      </div> : <p className="muted">ยังไม่มี Event จาก Pilot</p>}
    </section>
    <div className="dashboard-grid" style={{marginTop: 24}}>
      <section className="dashboard-card"><h2>Event breakdown</h2>
        {Object.keys(eventCounts).length
          ? Object.entries(eventCounts).sort((a, b) => b[1] - a[1]).map(([name, count]) => <p key={name}>{name}: <strong>{count}</strong></p>)
          : <p className="muted">ยังไม่มีข้อมูล</p>}
      </section>
      <section className="dashboard-card"><h2>Top Places</h2>
        {topPlaces.length
          ? topPlaces.map((place, index) => <p key={place.placeId}>{index + 1}. {place.name}: <strong>{place.engagements}</strong></p>)
          : <p className="muted">ยังไม่มี Place engagement</p>}
      </section>
    </div>
  </div></main>;
}
