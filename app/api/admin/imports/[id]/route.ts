import {NextResponse} from 'next/server';
import {getAdminContext} from '@/lib/admin-access';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(_request: Request, {params}: {params: Promise<{id: string}>}) {
  const {id} = await params;
  const {supabase, user, admin} = await getAdminContext();
  if (!user) return NextResponse.json({error: 'กรุณาเข้าสู่ระบบ'}, {status: 401});
  if (!admin) return NextResponse.json({error: 'ไม่มีสิทธิ์ Admin'}, {status: 403});
  if (!uuid.test(id)) return NextResponse.json({error: 'ID ไม่ถูกต้อง'}, {status: 400});
  const {data, error} = await supabase.rpc('admin_find_place_import_duplicates', {candidate_id: id});
  return error ? NextResponse.json({error: error.message}, {status: 400}) : NextResponse.json({matches: data});
}

export async function POST(request: Request, {params}: {params: Promise<{id: string}>}) {
  const {id} = await params;
  const {supabase, user, admin} = await getAdminContext();
  if (!user) return NextResponse.json({error: 'กรุณาเข้าสู่ระบบ'}, {status: 401});
  if (!admin) return NextResponse.json({error: 'ไม่มีสิทธิ์ Admin'}, {status: 403});
  if (!uuid.test(id)) return NextResponse.json({error: 'ID ไม่ถูกต้อง'}, {status: 400});
  try {
    const body = await request.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('ข้อมูลไม่ถูกต้อง');
    if (body.action === 'reject') {
      if (typeof body.reason !== 'string' || !body.reason.trim() || body.reason.length > 2000) throw new Error('ต้องระบุเหตุผล');
      const {error} = await supabase.rpc('admin_reject_place_import', {candidate_id: id, reason: body.reason.trim()});
      return error ? NextResponse.json({error: error.message}, {status: 400}) : NextResponse.json({status: 'rejected'});
    }
    if (body.action !== 'accept') throw new Error('Action ไม่ถูกต้อง');
    if (body.existing_place_id != null && (typeof body.existing_place_id !== 'string' || !uuid.test(body.existing_place_id))) throw new Error('Place ID ไม่ถูกต้อง');
    if (body.reviewed_distinct_ids !== undefined && (!Array.isArray(body.reviewed_distinct_ids)
      || body.reviewed_distinct_ids.length > 200
      || body.reviewed_distinct_ids.some((x: unknown) => typeof x !== 'string' || !uuid.test(x)))) throw new Error('รายการที่ตรวจไม่ถูกต้อง');
    // JSON null, omitted and blank are all "no reason" for ordinary accepts/links.
    // Wrong types still reject; distinct-venue overrides still require a real reason.
    if (body.distinct_reason != null && (typeof body.distinct_reason !== 'string' || body.distinct_reason.length > 2000)) throw new Error('เหตุผลไม่ถูกต้อง');
    const distinctReason = typeof body.distinct_reason === 'string' ? body.distinct_reason.trim() || null : null;
    const distinctIds: string[] = body.reviewed_distinct_ids ?? [];
    if (distinctIds.length > 0 && (!distinctReason || distinctReason.length < 10)) throw new Error('ต้องระบุเหตุผลที่เป็นคนละสถานที่อย่างน้อย 10 ตัวอักษร');
    const {data, error} = await supabase.rpc('admin_accept_place_import', {
      candidate_id: id,
      existing_place_id: body.existing_place_id ?? null,
      reviewed_distinct_ids: distinctIds,
      distinct_reason: distinctReason,
    });
    return error ? NextResponse.json({error: error.message}, {status: error.code === '23505' ? 409 : 400}) : NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({error: error instanceof Error ? error.message : 'ข้อมูลไม่ถูกต้อง'}, {status: 400});
  }
}
