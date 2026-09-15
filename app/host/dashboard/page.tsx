import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { mapListing } from '@/lib/listings';
import { ListingCard } from '@/components/listing/ListingCard';

export default async function HostDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/host/login');

  const { data: host, error: hostError } = await supabase
    .from('hosts')
    .select('id, business_name, contact_name, email, status')
    .eq('user_id', user.id)
    .maybeSingle();

  if (hostError || !host) redirect('/host');

  const { data: listingRows, error: listingsError } = await supabase
    .from('listings')
    .select('*')
    .eq('host_id', host.id)
    .order('created_at', { ascending: false });

  const listings = listingsError ? [] : (listingRows ?? []).map(mapListing);
  const publishedCount = listings.filter((listing) => listing.status === 'published').length;

  return (
    <main className="page">
      <div className="container section">
        <div className="section-head">
          <div>
            <p className="muted">Host Dashboard</p>
            <h1>{host.business_name || 'สำหรับเจ้าของที่พัก'}</h1>
            <p className="muted" style={{ marginTop: 6 }}>
              {host.contact_name || user.email} · {host.status}
            </p>
          </div>
          <Link href="/host/listings/new" className="btn btn-primary">+ เพิ่มที่พัก</Link>
        </div>

        <div className="dashboard-grid" style={{ marginTop: 24 }}>
          <div className="stat">
            <div className="muted">ที่พักทั้งหมด</div>
            <div className="stat-value">{listings.length}</div>
          </div>
          <div className="stat">
            <div className="muted">เผยแพร่แล้ว</div>
            <div className="stat-value">{publishedCount}</div>
          </div>
          <div className="stat">
            <div className="muted">สถานะบัญชี</div>
            <div className="stat-value">{host.status}</div>
          </div>
          <div className="stat">
            <div className="muted">อีเมล</div>
            <div className="stat-value" style={{ fontSize: '1rem', wordBreak: 'break-word' }}>{host.email || user.email}</div>
          </div>
        </div>

        <section style={{ marginTop: 42 }}>
          <div className="section-head">
            <div>
              <h2>ที่พักของฉัน</h2>
              <p className="muted">รายการที่เชื่อมกับบัญชี Host นี้</p>
            </div>
          </div>

          {listings.length > 0 ? (
            <div className="grid">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="dashboard-card">
              <h3>ยังไม่มีที่พัก</h3>
              <p className="muted" style={{ marginTop: 6 }}>
                บัญชีนี้ยังไม่มี Listing ที่เชื่อมอยู่ครับ
              </p>
              <Link href="/host/listings/new" className="btn btn-primary" style={{ marginTop: 18 }}>
                เพิ่มที่พักแรกของคุณ
              </Link>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
