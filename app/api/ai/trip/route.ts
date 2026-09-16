import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { mapListing } from '@/lib/listings';
import { buildTripPlan } from '@/lib/ai/agent';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const input = String(body?.input || '').trim();

    if (!input) {
      return NextResponse.json({ error: 'กรุณาเล่ารายละเอียดทริปก่อนครับ' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('status', 'published');

    if (error) {
      return NextResponse.json({ error: 'ไม่สามารถโหลดข้อมูลที่พักได้ครับ' }, { status: 500 });
    }

    const listings = (data || []).map(mapListing);
    const plan = buildTripPlan(input, listings);

    return NextResponse.json({ status: 'ok', plan });
  } catch {
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการจัดทริปครับ' }, { status: 500 });
  }
}
