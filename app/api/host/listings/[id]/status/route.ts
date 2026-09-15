import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
  if (host.status !== 'active') return NextResponse.json({ error: 'บัญชี Host นี้ยังไม่พร้อมจัดการ Listing ครับ' }, { status: 403 });

  const body = await request.json();
  const status = body.status === 'published' ? 'published' : body.status === 'draft' ? 'draft' : null;

  if (!status) return NextResponse.json({ error: 'สถานะ Listing ไม่ถูกต้องครับ' }, { status: 400 });

  const { data: ownedListing, error: listingError } = await supabase
    .from('listings')
    .select('id')
    .eq('id', id)
    .eq('host_id', host.id)
    .maybeSingle();

  if (listingError || !ownedListing) return NextResponse.json({ error: 'ไม่พบ Listing นี้ในบัญชีของคุณครับ' }, { status: 404 });

  const { data, error } = await supabase
    .from('listings')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('host_id', host.id)
    .select('id, status')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
