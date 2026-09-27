import {NextResponse} from 'next/server';
import {getAdminContext} from '@/lib/admin-access';

const BUCKET = 'editorial-images';
const MAX_FILE_SIZE = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const RIGHTS_BASES = new Set(['owner', 'licensed', 'public_domain', 'geppao_owned']);
const clean = (value: FormDataEntryValue | null, max: number) => typeof value === 'string' ? value.trim().slice(0, max) : '';

async function context(id: string) {
  const access = await getAdminContext();
  if (!access.user || !access.admin) return {...access, article: null};
  const {data: article} = await access.supabase.from('articles')
    .select('id,cover_image_url,cover_alt_text,cover_rights_holder,cover_rights_basis,cover_permission_evidence,cover_approved_for_public')
    .eq('id', id).maybeSingle();
  return {...access, article};
}

function pathFromUrl(url: string) {
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const index = url.indexOf(marker);
  return index < 0 ? null : decodeURIComponent(url.slice(index + marker.length));
}

export async function POST(request: Request, {params}: {params: Promise<{id: string}>}) {
  const {id} = await params;
  const access = await context(id);
  if (!access.user) return NextResponse.json({error: 'กรุณาเข้าสู่ระบบ'}, {status: 401});
  if (!access.admin) return NextResponse.json({error: 'ไม่มีสิทธิ์ Admin'}, {status: 403});
  if (!access.article) return NextResponse.json({error: 'ไม่พบบทความ'}, {status: 404});
  if (access.article.cover_image_url) return NextResponse.json({error: 'กรุณาลบรูปปกเดิมก่อนอัปโหลดใหม่'}, {status: 400});

  const form = await request.formData();
  const file = form.get('file');
  const altText = clean(form.get('altText'), 300);
  const rightsHolder = clean(form.get('rightsHolder'), 200);
  const rightsBasis = clean(form.get('rightsBasis'), 30);
  const permissionEvidence = clean(form.get('permissionEvidence'), 500);
  if (form.get('rightsConfirmed') !== 'true' || !altText || !rightsHolder || !RIGHTS_BASES.has(rightsBasis) || !permissionEvidence) {
    return NextResponse.json({error: 'ต้องระบุ Alt text เจ้าของสิทธิ์ ฐานสิทธิ์ และหลักฐานให้ครบ'}, {status: 400});
  }
  if (!(file instanceof File) || !ALLOWED_TYPES.has(file.type) || file.size > MAX_FILE_SIZE) {
    return NextResponse.json({error: 'ใช้ JPG, PNG หรือ WebP ขนาดไม่เกิน 8 MB'}, {status: 400});
  }

  const extension = file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/png' ? 'png' : 'webp';
  const path = `admin/${id}/${crypto.randomUUID()}.${extension}`;
  const {error: uploadError} = await access.supabase.storage.from(BUCKET).upload(path, file, {contentType: file.type, upsert: false});
  if (uploadError) return NextResponse.json({error: uploadError.message}, {status: 500});

  const url = access.supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  const {error: updateError} = await access.supabase.from('articles').update({
    cover_image_url: url,
    cover_alt_text: altText,
    cover_rights_holder: rightsHolder,
    cover_rights_basis: rightsBasis,
    cover_permission_evidence: permissionEvidence,
    cover_approved_for_public: false,
    cover_approved_by: null,
    cover_approved_at: null,
    updated_at: new Date().toISOString(),
  }).eq('id', id);
  if (updateError) {
    await access.supabase.storage.from(BUCKET).remove([path]);
    return NextResponse.json({error: updateError.message}, {status: 500});
  }
  return NextResponse.json({url}, {status: 201});
}

export async function PATCH(request: Request, {params}: {params: Promise<{id: string}>}) {
  const {id} = await params;
  const access = await context(id);
  if (!access.user) return NextResponse.json({error: 'กรุณาเข้าสู่ระบบ'}, {status: 401});
  if (!access.admin) return NextResponse.json({error: 'ไม่มีสิทธิ์ Admin'}, {status: 403});
  if (!access.article) return NextResponse.json({error: 'ไม่พบบทความ'}, {status: 404});
  const {action} = await request.json();
  if (action === 'revoke') {
    const {error} = await access.supabase.from('articles').update({cover_approved_for_public: false, cover_approved_by: null, cover_approved_at: null, updated_at: new Date().toISOString()}).eq('id', id);
    return error ? NextResponse.json({error: error.message}, {status: 500}) : NextResponse.json({success: true});
  }
  if (action !== 'approve') return NextResponse.json({error: 'Action ไม่ถูกต้อง'}, {status: 400});
  const path = pathFromUrl(access.article.cover_image_url ?? '');
  if (!path || !path.startsWith(`admin/${id}/`) || !access.article.cover_alt_text || !access.article.cover_rights_holder || !access.article.cover_rights_basis || !access.article.cover_permission_evidence) {
    return NextResponse.json({error: 'หลักฐานสิทธิ์ยังไม่ครบหรือไฟล์ไม่ได้อยู่ใน GepPao Storage'}, {status: 400});
  }
  const {error} = await access.supabase.from('articles').update({
    cover_approved_for_public: true,
    cover_approved_by: access.user.id,
    cover_approved_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq('id', id);
  return error ? NextResponse.json({error: error.message}, {status: 500}) : NextResponse.json({success: true});
}

export async function DELETE(_request: Request, {params}: {params: Promise<{id: string}>}) {
  const {id} = await params;
  const access = await context(id);
  if (!access.user) return NextResponse.json({error: 'กรุณาเข้าสู่ระบบ'}, {status: 401});
  if (!access.admin) return NextResponse.json({error: 'ไม่มีสิทธิ์ Admin'}, {status: 403});
  if (!access.article) return NextResponse.json({error: 'ไม่พบบทความ'}, {status: 404});
  const path = pathFromUrl(access.article.cover_image_url ?? '');
  if (!path || !path.startsWith(`admin/${id}/`)) return NextResponse.json({error: 'รูปนี้ไม่ได้อยู่ในพื้นที่ Editorial'}, {status: 403});
  const {error: removeError} = await access.supabase.storage.from(BUCKET).remove([path]);
  if (removeError) return NextResponse.json({error: removeError.message}, {status: 500});
  const {error} = await access.supabase.from('articles').update({
    cover_image_url: null,
    cover_alt_text: null,
    cover_rights_holder: null,
    cover_rights_basis: null,
    cover_permission_evidence: null,
    cover_approved_for_public: false,
    cover_approved_by: null,
    cover_approved_at: null,
    updated_at: new Date().toISOString(),
  }).eq('id', id);
  return error ? NextResponse.json({error: error.message}, {status: 500}) : NextResponse.json({success: true});
}