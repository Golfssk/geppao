import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { mapListing } from '@/lib/listings';
import { isManagedPublicMediaUrl } from '@/lib/public-media';

export default async function StayDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase.from('listings').select('*').eq('slug', slug).eq('status', 'published').maybeSingle();
  if (error || !data) return notFound();

  const l = mapListing(data);
  const images = (l.images || []).filter(isManagedPublicMediaUrl);
  const hasCoordinates = typeof l.latitude === 'number' && typeof l.longitude === 'number';
  const mapsUrl = l.googleMapsUrl || (hasCoordinates ? `https://www.google.com/maps?q=${l.latitude},${l.longitude}` : '');

  return (
    <main className="page">
      <div className="container detail">
        <a href="/search" className="muted">← กลับไปค้นหา</a>

        <div className="card" style={{ marginTop: 20 }}>
          {images.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: images.length > 1 ? '2fr 1fr' : '1fr', gap: 8, background: 'var(--sand)', padding: 8 }}>
              <img src={images[0]} alt={l.name} style={{ width: '100%', height: 340, objectFit: 'cover', borderRadius: 10 }} />
              {images.length > 1 && <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: 8 }}>{images.slice(1, 3).map((image, index) => <img key={image} src={image} alt={`${l.name} ${index + 2}`} style={{ width: '100%', height: 166, objectFit: 'cover', borderRadius: 10 }} />)}</div>}
            </div>
          ) : <div className="thumb" style={{ height: 340 }} />}

          <div className="card-body">
            <h1>{l.name}</h1>
            <p className="muted">{l.location}</p>
            {l.address && <p className="muted">{l.address}</p>}
            <p>{l.description}</p>
            <p className="price">฿{l.price.toLocaleString()} {l.priceUnit}</p>
            <div className="chips" style={{ marginBottom: 20 }}>{l.vibe.map((v) => <span className="chip" style={{ background: 'var(--sand)', color: 'var(--forest)', borderColor: 'var(--line)' }} key={v}>{v}</span>)}</div>
            <a className="btn btn-rust" href={`/api/leads?listingId=${l.id}`}>ติดต่อที่พัก</a>
          </div>
        </div>

        {(hasCoordinates || mapsUrl) && (
          <section className="card" style={{ marginTop: 20 }}>
            <div className="card-body">
              <div className="section-head"><div><h2 style={{ margin: 0 }}>Location</h2><p className="muted" style={{ marginTop: 6 }}>{l.address || l.location}</p></div>{mapsUrl && <a className="btn" href={mapsUrl} target="_blank" rel="noreferrer">เปิด Google Maps</a>}</div>
              {hasCoordinates && <iframe title={`แผนที่ ${l.name}`} src={`https://www.google.com/maps?q=${l.latitude},${l.longitude}&output=embed`} style={{ width: '100%', height: 360, border: 0, borderRadius: 12, marginTop: 16 }} loading="lazy" />}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
