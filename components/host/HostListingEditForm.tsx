'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Listing } from '@/types/listing';

const VIBES = ['nature', 'chill', 'photography', 'minimal', 'family', 'couple', 'party', 'fun', 'luxury', 'cafe'];
const AMENITIES = ['สระว่ายน้ำส่วนตัว', 'Free Wi-Fi', 'เตาปิ้งย่าง', 'ห้องครัว', 'คาราโอเกะ', 'โต๊ะพูล', 'ที่จอดรถ', 'อ่างอาบน้ำ', 'ดาดฟ้าชมดาว'];

export function HostListingEditForm({ listing }: { listing: Listing }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: listing.name,
    location: listing.location,
    price: String(listing.price),
    priceUnit: listing.priceUnit || ' / คืน',
    capacity: String(listing.capacity),
    category: listing.category || 'poolvilla',
    description: listing.description || '',
    vibes: listing.vibe,
    amenities: listing.amenities,
    petFriendly: listing.petFriendly,
    partyFriendly: listing.partyFriendly,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function toggle(list: string[], value: string) {
    return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);

    const response = await fetch(`/api/host/listings/${listing.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    const result = await response.json();

    if (!response.ok) {
      setError(result.error || 'ไม่สามารถบันทึกการแก้ไขได้ครับ');
      setLoading(false);
      return;
    }

    router.push('/host/dashboard');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="card" style={{ maxWidth: 820, marginTop: 24 }}>
      <div className="card-body">
        <div className="filter-group">
          <label htmlFor="name">ชื่อที่พัก *</label>
          <input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>

        <div className="grid" style={{ marginTop: 16 }}>
          <div className="filter-group">
            <label htmlFor="location">ทำเล *</label>
            <input id="location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} required />
          </div>
          <div className="filter-group">
            <label htmlFor="category">ประเภทที่พัก *</label>
            <select id="category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option value="poolvilla">Pool Villa</option>
              <option value="camping">Camping</option>
            </select>
          </div>
        </div>

        <div className="grid" style={{ marginTop: 16 }}>
          <div className="filter-group">
            <label htmlFor="price">ราคา *</label>
            <input id="price" type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
          </div>
          <div className="filter-group">
            <label htmlFor="priceUnit">หน่วยราคา</label>
            <select id="priceUnit" value={form.priceUnit} onChange={(e) => setForm({ ...form, priceUnit: e.target.value })}>
              <option value=" / คืน">/ คืน</option>
              <option value=" / คน / คืน">/ คน / คืน</option>
            </select>
          </div>
          <div className="filter-group">
            <label htmlFor="capacity">รองรับได้ (คน) *</label>
            <input id="capacity" type="number" min="1" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} required />
          </div>
        </div>

        <div className="filter-group" style={{ marginTop: 16 }}>
          <label htmlFor="description">คำอธิบาย</label>
          <textarea id="description" rows={5} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>

        <div className="filter-group" style={{ marginTop: 20 }}>
          <label>Vibe</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
            {VIBES.map((vibe) => (
              <button key={vibe} type="button" className={form.vibes.includes(vibe) ? 'btn btn-primary' : 'btn'} onClick={() => setForm({ ...form, vibes: toggle(form.vibes, vibe) })}>{vibe}</button>
            ))}
          </div>
        </div>

        <div className="filter-group" style={{ marginTop: 20 }}>
          <label>Amenities</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
            {AMENITIES.map((amenity) => (
              <button key={amenity} type="button" className={form.amenities.includes(amenity) ? 'btn btn-primary' : 'btn'} onClick={() => setForm({ ...form, amenities: toggle(form.amenities, amenity) })}>{amenity}</button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginTop: 20 }}>
          <label><input type="checkbox" checked={form.petFriendly} onChange={(e) => setForm({ ...form, petFriendly: e.target.checked })} /> Pet friendly</label>
          <label><input type="checkbox" checked={form.partyFriendly} onChange={(e) => setForm({ ...form, partyFriendly: e.target.checked })} /> Party friendly</label>
        </div>

        {error && <p role="alert" style={{ color: 'var(--rust)', marginTop: 20 }}>{error}</p>}

        <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
          <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}</button>
          <button className="btn" type="button" onClick={() => router.push('/host/dashboard')}>ยกเลิก</button>
        </div>
      </div>
    </form>
  );
}
