'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function ListingStatusButton({ listingId, status }: { listingId: string; status?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const published = status === 'published';

  async function toggleStatus() {
    setLoading(true);
    setError('');

    const response = await fetch(`/api/host/listings/${listingId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: published ? 'draft' : 'published' }),
    });

    const result = await response.json();

    if (!response.ok) {
      setError(result.error || 'ไม่สามารถเปลี่ยนสถานะ Listing ได้ครับ');
      setLoading(false);
      return;
    }

    router.refresh();
    setLoading(false);
  }

  return (
    <div style={{ marginTop: 10 }}>
      <button type="button" className="btn" onClick={toggleStatus} disabled={loading}>
        {loading ? 'กำลังบันทึก...' : published ? 'Unpublish' : 'Publish'}
      </button>
      <span className="muted" style={{ marginLeft: 10, fontSize: '.85rem' }}>
        {published ? 'เผยแพร่แล้ว' : 'Draft'}
      </span>
      {error && <p role="alert" style={{ color: 'var(--rust)', marginTop: 8, fontSize: '.85rem' }}>{error}</p>}
    </div>
  );
}
