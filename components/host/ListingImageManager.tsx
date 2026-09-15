'use client';

import { ChangeEvent, useState } from 'react';
import Image from 'next/image';

export function ListingImageManager({ listingId, images: initialImages }: { listingId: string; images: string[] }) {
  const [images, setImages] = useState(initialImages);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    if (images.length + files.length > 10) {
      setError('Listing หนึ่งรายการใส่รูปได้สูงสุด 10 รูปครับ');
      event.target.value = '';
      return;
    }

    setLoading(true); setError('');
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        const response = await fetch(`/api/host/listings/${listingId}/images`, { method: 'POST', body: formData });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'อัปโหลดรูปไม่สำเร็จครับ');
        setImages((current) => [...current, result.url]);
      }
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'อัปโหลดรูปไม่สำเร็จครับ');
    } finally {
      setLoading(false); event.target.value = '';
    }
  }

  async function remove(url: string) {
    if (!window.confirm('ต้องการลบรูปนี้ใช่ไหมครับ?')) return;
    setError('');
    const response = await fetch(`/api/host/listings/${listingId}/images`, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }),
    });
    const result = await response.json();
    if (!response.ok) { setError(result.error || 'ลบรูปไม่สำเร็จครับ'); return; }
    setImages((current) => current.filter((item) => item !== url));
  }

  return (
    <section className="card" style={{ maxWidth: 820, marginTop: 24 }}>
      <div className="card-body">
        <div className="section-head">
          <div><h2 style={{ margin: 0 }}>รูปภาพที่พัก</h2><p className="muted" style={{ marginTop: 6 }}>แนะนำ 5–10 รูป · JPG, PNG หรือ WebP · ไม่เกิน 8 MB/รูป</p></div>
          <label className="btn btn-primary" style={{ cursor: 'pointer' }}>
            {loading ? 'กำลังอัปโหลด...' : 'เพิ่มรูป'}
            <input type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={upload} disabled={loading || images.length >= 10} />
          </label>
        </div>

        {images.length === 0 ? <div className="thumb" style={{ height: 220, marginTop: 16, display: 'grid', placeItems: 'center' }}><span className="muted">ยังไม่มีรูปภาพ</span></div> : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginTop: 16 }}>
            {images.map((url, index) => (
              <div key={url} style={{ position: 'relative' }}>
                <div style={{ position: 'relative', aspectRatio: '4 / 3', overflow: 'hidden', borderRadius: 12, background: 'var(--sand)' }}>
                  <Image src={url} alt={`รูปที่พัก ${index + 1}`} fill sizes="(max-width: 820px) 50vw, 180px" style={{ objectFit: 'cover' }} unoptimized />
                </div>
                <button type="button" className="btn" style={{ marginTop: 8, width: '100%' }} onClick={() => remove(url)}>ลบรูป</button>
              </div>
            ))}
          </div>
        )}
        {error && <p role="alert" style={{ color: 'var(--rust)', marginTop: 16 }}>{error}</p>}
      </div>
    </section>
  );
}
