'use client';

import {useRef, useState} from 'react';
import {useRouter} from 'next/navigation';

type ArticleCover = {
  id: string;
  cover_image_url?: string | null;
  cover_alt_text?: string | null;
  cover_rights_holder?: string | null;
  cover_rights_basis?: string | null;
  cover_permission_evidence?: string | null;
  cover_approved_for_public?: boolean;
  cover_approved_at?: string | null;
};

export function ArticleCoverManager({article}: {article: ArticleCover}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function upload(formData: FormData) {
    setBusy(true);
    setMessage('');
    const response = await fetch(`/api/admin/articles/${article.id}/cover`, {method: 'POST', body: formData});
    const result = await response.json();
    setBusy(false);
    if (!response.ok) return setMessage(result.error ?? 'อัปโหลดไม่สำเร็จ');
    formRef.current?.reset();
    setMessage('อัปโหลดแล้ว — ต้องกดอนุมัติก่อนแสดงสาธารณะ');
    router.refresh();
  }

  async function action(value: 'approve' | 'revoke' | 'delete') {
    setBusy(true);
    setMessage('');
    const response = await fetch(`/api/admin/articles/${article.id}/cover`, {
      method: value === 'delete' ? 'DELETE' : 'PATCH',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({action: value}),
    });
    const result = await response.json();
    setBusy(false);
    if (!response.ok) return setMessage(result.error ?? 'ดำเนินการไม่สำเร็จ');
    setMessage(value === 'approve' ? 'อนุมัติรูปปกแล้ว' : value === 'revoke' ? 'ถอนการอนุมัติแล้ว' : 'ลบรูปปกแล้ว');
    router.refresh();
  }

  return <section className="dashboard-card" style={{marginTop: 24}}>
    <h2>รูปปกและสิทธิ์สื่อ</h2>
    <p className="form-hint">ไฟล์จะอยู่ใน GepPao Storage และจะไม่แสดงสาธารณะจนกว่า Admin จะตรวจหลักฐานครบแล้วกดอนุมัติ</p>
    {article.cover_image_url ? <div className="form-grid" style={{marginTop: 16}}>
      <div>
        <img src={article.cover_image_url} alt={article.cover_alt_text ?? ''} style={{width: '100%', maxHeight: 320, objectFit: 'cover', borderRadius: 16}} />
      </div>
      <div>
        <p><strong>Alt:</strong> {article.cover_alt_text}</p>
        <p><strong>เจ้าของสิทธิ์:</strong> {article.cover_rights_holder}</p>
        <p><strong>ฐานสิทธิ์:</strong> {article.cover_rights_basis}</p>
        <p><strong>หลักฐาน:</strong> {article.cover_permission_evidence}</p>
        <p><strong>สถานะ:</strong> {article.cover_approved_for_public ? `อนุมัติแล้ว${article.cover_approved_at ? ` · ${new Date(article.cover_approved_at).toLocaleString('th-TH')}` : ''}` : 'ยังไม่อนุมัติ'}</p>
        <div className="form-actions">
          {article.cover_approved_for_public
            ? <button type="button" className="btn btn-sage" disabled={busy} onClick={() => action('revoke')}>ถอนอนุมัติ</button>
            : <button type="button" className="btn btn-primary" disabled={busy} onClick={() => action('approve')}>อนุมัติให้แสดงสาธารณะ</button>}
          <button type="button" className="btn btn-rust" disabled={busy} onClick={() => action('delete')}>ลบรูป</button>
        </div>
      </div>
    </div> : <form ref={formRef} action={upload} style={{marginTop: 16}}>
      <div className="form-grid">
        <div className="form-field"><label htmlFor="coverFile">ไฟล์ JPG, PNG หรือ WebP</label><input id="coverFile" name="file" type="file" accept="image/jpeg,image/png,image/webp" required /></div>
        <div className="form-field"><label htmlFor="coverAlt">Alt text</label><input id="coverAlt" name="altText" maxLength={300} required /></div>
        <div className="form-field"><label htmlFor="rightsHolder">เจ้าของสิทธิ์</label><input id="rightsHolder" name="rightsHolder" maxLength={200} required /></div>
        <div className="form-field"><label htmlFor="rightsBasis">ฐานสิทธิ์</label><select id="rightsBasis" name="rightsBasis" required><option value="">เลือก</option><option value="owner">เจ้าของมอบสิทธิ์</option><option value="licensed">มี License</option><option value="public_domain">Public domain</option><option value="geppao_owned">GepPao ถ่าย/สร้างเอง</option></select></div>
        <div className="form-field"><label htmlFor="permissionEvidence">หลักฐานสิทธิ์</label><input id="permissionEvidence" name="permissionEvidence" maxLength={500} placeholder="อีเมล/เอกสาร/URL/เลขอ้างอิง" required /></div>
        <div className="form-field"><label className="checkbox-row"><input name="rightsConfirmed" type="checkbox" value="true" required />ยืนยันว่ามีสิทธิ์ใช้งานรูปนี้</label></div>
      </div>
      <div className="form-actions"><button className="btn btn-primary" disabled={busy}>{busy ? 'กำลังอัปโหลด...' : 'อัปโหลดรูปปก'}</button></div>
    </form>}
    {message && <p className="form-hint" role="status">{message}</p>}
  </section>;
}