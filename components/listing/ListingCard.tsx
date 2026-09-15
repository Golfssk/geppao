import type { Listing } from '@/types/listing';
import Link from 'next/link';

export function ListingCard({ listing, editable = false }: { listing: Listing & { score?: number }; editable?: boolean }) {
  return (
    <div className="card">
      <Link href={`/stay/${listing.slug}`}>
        <div className="thumb"></div>
        <div className="card-body">
          <h3>{listing.name}</h3>
          <div className="muted">{listing.location} · {listing.vibe.slice(0, 3).join(' · ')}</div>
          <div className="price">฿{listing.price.toLocaleString()} {listing.priceUnit}</div>
          {typeof listing.score === 'number' && (
            <div className="muted" style={{ marginTop: 6, fontSize: '.8rem' }}>
              AI Match {Math.round(listing.score * 100)}%
            </div>
          )}
        </div>
      </Link>
      {editable && (
        <div style={{ padding: '0 16px 16px' }}>
          <Link href={`/host/listings/${listing.id}/edit`} className="btn btn-primary">
            แก้ไข Listing
          </Link>
        </div>
      )}
    </div>
  );
}
