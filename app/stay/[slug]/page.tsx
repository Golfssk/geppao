import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { mapListing } from '@/lib/listings';

export default async function StayDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();

  if (error || !data) return notFound();

  const l = mapListing(data);

  return (
    <main className="page">
      <div className="container detail">
        <a href="/search" className="muted">← กลับไปค้นหา</a>
        <div className="card" style={{ marginTop: 20 }}>
          <div className="thumb" style={{ height: 340 }}></div>
          <div className="card-body">
            <h1>{l.name}</h1>
            <p className="muted">{l.location}</p>
            <p>{l.description}</p>
            <p className="price">฿{l.price.toLocaleString()} {l.priceUnit}</p>
            <div className="chips" style={{ marginBottom: 20 }}>
              {l.vibe.map((v) => (
                <span
                  className="chip"
                  style={{ background: 'var(--sand)', color: 'var(--forest)', borderColor: 'var(--line)' }}
                  key={v}
                >
                  {v}
                </span>
              ))}
            </div>
            <a className="btn btn-rust" href={`/api/leads?listingId=${l.id}`}>ติดต่อที่พัก</a>
          </div>
        </div>
      </div>
    </main>
  );
}
