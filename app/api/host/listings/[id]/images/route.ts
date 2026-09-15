import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const BUCKET = 'listing-images';
const MAX_FILE_SIZE = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

async function getHostAndListing(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, host: null, listing: null, error: 'กรุณาเข้าสู่ระบบก่อนครับ' };

  const { data: host, error: hostError } = await supabase
    .from('hosts').select('id, status').eq('user_id', user.id).maybeSingle();
  if (hostError || !host) return { supabase, user, host: null, listing: null, error: 'ไม่พบข้อมูล Host ของบัญชีนี้ครับ' };
  if (host.status !== 'active') return { supabase, user, host: null, listing: null, error: 'บัญชี Host นี้ยังไม่พร้อมจัดการรูปภาพครับ' };

  const { data: listing, error: listingError } = await supabase
    .from('listings').select('id, host_id, images').eq('id', id).eq('host_id', host.id).maybeSingle();
  if (listingError || !listing) return { supabase, user, host, listing: null, error: 'ไม่พบ Listing นี้ในบัญชีของคุณครับ' };

  return { supabase, user, host, listing, error: null };
}

function publicUrl(supabase: Awaited<ReturnType<typeof createClient>>, path: string) {
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

function pathFromUrl(url: string, supabaseUrl: string) {
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const index = url.indexOf(marker);
  if (index === -1) return null;
  const path = decodeURIComponent(url.slice(index + marker.length));
  return path || null;
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const context = await getHostAndListing(id);
  if (context.error) return NextResponse.json({ error: context.error }, { status: context.user ? 403 : 401 });

  const { supabase, host, listing } = context;
  if (!host || !listing) return NextResponse.json({ error: 'ไม่พบ Listing นี้ครับ' }, { status: 404 });

  const currentImages = Array.isArray(listing.images) ? listing.images : [];
  if (currentImages.length >= 10) return NextResponse.json({ error: 'Listing หนึ่งรายการใส่รูปได้สูงสุด 10 รูปครับ' }, { status: 400 });

  const formData = await request.formData();
  const file = formData.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'กรุณาเลือกไฟล์รูปภาพครับ' }, { status: 400 });
  if (!ALLOWED_TYPES.has(file.type)) return NextResponse.json({ error: 'รองรับเฉพาะ JPG, PNG และ WebP ครับ' }, { status: 400 });
  if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: 'รูปภาพต้องมีขนาดไม่เกิน 8 MB ครับ' }, { status: 400 });

  const extension = file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/png' ? 'png' : 'webp';
  const path = `${host.id}/${listing.id}/${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const url = publicUrl(supabase, path);
  const images = [...currentImages, url];
  const { error: updateError } = await supabase.from('listings').update({ images, updated_at: new Date().toISOString() }).eq('id', listing.id).eq('host_id', host.id);

  if (updateError) {
    await supabase.storage.from(BUCKET).remove([path]);
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ url }, { status: 201 });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const context = await getHostAndListing(id);
  if (context.error) return NextResponse.json({ error: context.error }, { status: context.user ? 403 : 401 });

  const { supabase, host, listing } = context;
  if (!host || !listing) return NextResponse.json({ error: 'ไม่พบ Listing นี้ครับ' }, { status: 404 });

  const body = await request.json();
  const url = String(body.url || '');
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const path = pathFromUrl(url, supabaseUrl);
  if (!path || !path.startsWith(`${host.id}/${listing.id}/`)) return NextResponse.json({ error: 'รูปภาพนี้ไม่ได้อยู่ใน Listing ของคุณครับ' }, { status: 403 });

  const images = (Array.isArray(listing.images) ? listing.images : []).filter((item: string) => item !== url);
  const { error: removeError } = await supabase.storage.from(BUCKET).remove([path]);
  if (removeError) return NextResponse.json({ error: removeError.message }, { status: 500 });

  const { error: updateError } = await supabase.from('listings').update({ images, updated_at: new Date().toISOString() }).eq('id', listing.id).eq('host_id', host.id);
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
