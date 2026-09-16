'use client';

import { useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';
import Link from 'next/link';
import type { TripPlan } from '@/lib/ai/agent';

function PlannerContent() {
  const params = useSearchParams();
  const [input, setInput] = useState(params.get('q') || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [plan, setPlan] = useState<TripPlan | null>(null);

  async function run() {
    if (!input.trim()) return;
    setLoading(true);
    setError('');
    setPlan(null);
    try {
      const response = await fetch('/api/ai/trip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'จัดทริปไม่สำเร็จครับ');
      setPlan(result.plan);
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : 'จัดทริปไม่สำเร็จครับ');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page">
      <div className="container section">
        <p className="muted">GepPao Planner</p>
        <h1>ให้ GepPao ช่วยวางทริป</h1>
        <p className="muted" style={{ marginTop: 8 }}>
          เล่าจำนวนคน งบ สไตล์ทริป และสิ่งที่อยากได้ แล้วระบบจะจับคู่กับที่พักที่มีอยู่ใน GepPao
        </p>

        <div className="planner-box" style={{ marginTop: 24 }}>
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="เช่น ไปเขาใหญ่กับเพื่อน 8 คน สายปาร์ตี้ มีหมา งบ 2,000 บาท/คน 2 วัน 1 คืน"
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, gap: 10, flexWrap: 'wrap' }}>
            <span className="muted" style={{ fontSize: '.82rem' }}>
              ระบบจะใช้เฉพาะ Listing ที่เผยแพร่แล้ว
            </span>
            <button className="btn btn-rust" disabled={loading || !input.trim()} onClick={run}>
              {loading ? 'กำลังจัดทริป...' : 'จัดทริปให้ฉัน'}
            </button>
          </div>
          {error && <p role="alert" style={{ color: 'var(--rust)', marginTop: 16 }}>{error}</p>}
        </div>

        {plan && (
          <div style={{ marginTop: 28 }}>
            <div className="section-head">
              <div>
                <p className="muted">Trip Summary</p>
                <h2 style={{ margin: 0 }}>{plan.summary.destination}</h2>
                <p className="muted" style={{ marginTop: 6 }}>
                  {plan.summary.guests ? `${plan.summary.guests} คน` : 'ยังไม่ระบุจำนวนคน'}
                  {plan.summary.budgetPerPerson ? ` · งบ ฿${plan.summary.budgetPerPerson.toLocaleString()}/คน` : ''}
                  {plan.summary.nights ? ` · ${plan.summary.nights} คืน` : ''}
                </p>
              </div>
            </div>

            <h2 style={{ marginTop: 28 }}>ที่พักที่เข้ากับทริป</h2>
            <div style={{ display: 'grid', gap: 14 }}>
              {plan.recommendedStays.map(({ listing, matchScore, reasons }) => (
                <div className="card" key={listing.id}>
                  <div className="card-body">
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start' }}>
                      <div>
                        <h3>{listing.name}</h3>
                        <p className="muted" style={{ marginTop: 5 }}>{listing.location} · รองรับ {listing.capacity} คน</p>
                      </div>
                      <strong>{Math.round(matchScore * 100)}% match</strong>
                    </div>
                    <p style={{ marginTop: 10 }}>฿{listing.price.toLocaleString()} {listing.priceUnit}</p>
                    <p className="muted" style={{ marginTop: 8 }}>{reasons.join(' · ')}</p>
                    <Link href={`/stay/${listing.slug}`} className="btn" style={{ marginTop: 12 }}>ดูที่พัก</Link>
                  </div>
                </div>
              ))}
            </div>

            <h2 style={{ marginTop: 32 }}>ตัวอย่าง Itinerary</h2>
            <div className="card">
              <div className="card-body">
                {plan.itinerary.map((item, index) => (
                  <div key={`${item.day}-${item.time}-${index}`} style={{ padding: '14px 0', borderBottom: index === plan.itinerary.length - 1 ? 0 : '1px solid var(--line)' }}>
                    <strong>Day {item.day} · {item.time}</strong>
                    <div style={{ marginTop: 5 }}>{item.activity}</div>
                    <div className="muted" style={{ marginTop: 4, fontSize: '.88rem' }}>{item.note}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function Planner() {
  return (
    <Suspense fallback={<main className="page"><div className="container section"><p className="muted">กำลังโหลด...</p></div></main>}>
      <PlannerContent />
    </Suspense>
  );
}
