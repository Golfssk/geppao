import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function makeSlug(value: string, id: string) {
  const base = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9ก-๙]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70);
  return `${base || 'listing'}-${id.slice(0, 8)}`;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบก่อนครับ' }, { status: 401 });

  const { data: host, error: hostError } = await supabase
    .from('hosts')
    .select('id, status')
    .eq('user_id', user.id)
    .maybeSingle();

  if (hostError || !host) return NextResponse.json({ error: 'ไม่พบข้อมูล Host ของบัญชีนี้ครับ' }, { status: 403 });
  if (host.status !== 'active') return NextResponse.json({ error: 'บัญชี Host นี้ยังไม่พร้อมแก้ไข Listing ครับ' }, { status: 403 });

  const { data: ownedListing, error: listingError } = await supabase
    .from('listings')
    .select('id')
    .eq('id', id)
    .eq('host_id', host.id)
    .maybeSingle();

  if (listingError || !ownedListing) return NextResponse.json({ error: 'ไม่พบ Listing นี้ในบัญชีของคุณครับ' }, { status: 404 });

  const body = await request.json();
  const name = String(body.name || '').trim();
  const location = String(body.location || '').trim();
  const price = Number(body.price);
  const capacity = Number(body.capacity);

  if (!name || !location || !Number.isFinite(price) || price < 0 || !Number.isInteger(capacity) || capacity < 1) {
    return NextResponse.json({ error: 'กรุณากรอกชื่อ ทำเล ราคา และจำนวนผู้เข้าพักให้ถูกต้องครับ' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('listings')
    .update({
      name,
      slug: makeSlug(name, id),
      location,
      price,
      price_unit: String(body.priceUnit || ' / คืน'),
      capacity,
      category: String(body.category || 'poolvilla'),
      vibe: Array.isArray(body.vibes) ? body.vibes : [],
      amenities: Array.isArray(body.amenities) ? body.amenities : [],
      pet_friendly: Boolean(body.petFriendly),
      party_friendly: Boolean(body.partyFriendly),
      description: String(body.description || '').trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('host_id', host.id)
    .select('id, slug')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบก่อนครับ' }, { status: 401 });

  const { data: host, error: hostError } = await supabase
    .from('hosts')
    .select('id, status')
    .eq('user_id', user.id)
    .maybeSingle();

  if (hostError || !host) return NextResponse.json({ error: 'ไม่พบข้อมูล Host ของบัญชีนี้ครับ' }, { status: 403 });
  if (host.status !== 'active') return NextResponse.json({ error: 'บัญชี Host นี้ยังไม่พร้อมลบ Listing ครับ' }, { status: 403 });

  const { data: ownedListing, error: listingError } = await supabase
    .from('listings')
    .select('id')
    .eq('id', id)
    .eq('host_id', host.id)
    .maybeSingle();

  if (listingError || !ownedListing) return NextResponse.json({ error: 'ไม่พบ Listing นี้ในบัญชีของคุณครับ' }, { status: 404 });

  const { error } = await supabase
    .from('listings')
    .delete()
    .eq('id', id)
    .eq('host_id', host.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
