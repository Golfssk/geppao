'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Listing } from '@/types/listing';

export function HostListingActions({ listing }: { listing: Listing }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function updateStatus(status: 'published' | 'draft') {
    setLoading(true);
    const response = await fetch(`/api/host/listings/${listing.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setLoading(false);
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      alert(result.error || 'ไม่สามารถเปลี่ยนสถานะ Listing ได้ครับ');
      return;
    }
    router.refresh();
  }

  async function deleteListing() {
    if (!window.confirm(`ต้องการลบ “${listing.name}” ใช่หรือไม่ครับ?\n\nการลบ Listing ไม่สามารถย้อนกลับได้`)) return;

    setLoading(true);
    const response = await fetch(`/api/host/listings/${listing.id}`, { method: 'DELETE' });
    setLoading(false);
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      alert(result.error || 'ไม่สามารถลบ Listing ได้ครับ');
      return;
    }
    router.refresh();
  }

  return (
    <div style={{ padding: '0 16px 16px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <Link href={`/host/listings/${listing.id}/edit`} className="btn btn-primary">แก้ไข</Link>
      {listing.status === 'published' ? (
        <button className="btn" type="button" disabled={loading} onClick={() => updateStatus('draft')}>
          {loading ? 'กำลังบันทึก...' : 'Unpublish'}
        </button>
      ) : (
        <button className="btn btn-sage" type="button" disabled={loading} onClick={() => updateStatus('published')}>
          {loading ? 'กำลังบันทึก...' : 'Publish'}
        </button>
      )}
      <button className="btn" type="button" disabled={loading} onClick={deleteListing} style={{ color: 'var(--rust)' }}>
        ลบ
      </button>
    </div>
  );
}
