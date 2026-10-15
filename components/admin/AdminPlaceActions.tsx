'use client';
import {useId,useState} from 'react';
import {useRouter} from 'next/navigation';
import {useLocale} from '@/components/i18n/LocaleProvider';
import s from './AdminManagement.module.css';
import {submitPlaceDecision,type PlaceDecision} from '@/lib/admin/moderation';
type Decision=PlaceDecision;
export function AdminPlaceActions({id,status,name='',demo=false}:{id:string;status:string;name?:string;demo?:boolean}){
 const router=useRouter(),uid=useId(),{locale}=useLocale(),en=locale==='en';
 const[note,setNote]=useState(''),[loading,setLoading]=useState(false),[error,setError]=useState(''),[confirm,setConfirm]=useState<Decision|null>(null),[message,setMessage]=useState('');
 const labels:Record<Decision,string>=en?{approve:'Approve & publish',reject:'Reject',archive:'Archive'}:{approve:'อนุมัติและเผยแพร่',reject:'ปฏิเสธ',archive:'เก็บถาวร'};
 async function moderate(decision:Decision){
  if(loading)return;if(decision==='reject'&&!note.trim()){setError(en?'A rejection reason is required.':'กรุณาระบุเหตุผลที่ปฏิเสธ');return}
  setLoading(true);setError('');setMessage('');
  try{
   const result=await submitPlaceDecision({id,decision,note,demo,en});
   if(result.simulated){setMessage(en?`Simulation: ${labels[decision]}. Nothing was saved.`:`จำลอง: ${labels[decision]} ยังไม่มีการบันทึกข้อมูล`);setConfirm(null);return}
   setConfirm(null);setNote('');setMessage(en?'Action completed. Refreshing records.':'ดำเนินการสำเร็จ กำลังอัปเดตรายการ');router.refresh();
  }catch(e){setError(e instanceof Error?e.message:(en?'Connection failed. Please retry.':'เชื่อมต่อไม่สำเร็จ กรุณาลองใหม่'))}finally{setLoading(false)}
 }
 return <div className={s.moderation}><label htmlFor={uid}>{en?'Review note':'บันทึกการตรวจสอบ'}</label><textarea id={uid} value={note} disabled={loading} onChange={e=>setNote(e.target.value)} placeholder={en?'Reason required when rejecting':'ต้องระบุเหตุผลเมื่อปฏิเสธ'} rows={2}/>{confirm?<div className={s.confirm} role="group" aria-labelledby={`${uid}-confirm`}><strong id={`${uid}-confirm`}>{labels[confirm]}?</strong><p>{name}</p><p>{demo?(en?'Demo only. This does not change a record.':'เดโมเท่านั้น ไม่เปลี่ยนแปลงรายการจริง'):confirm==='approve'?(en?'If server checks pass, this publishes the place and marks its information verified.':'เมื่อผ่านเงื่อนไข ระบบจะเผยแพร่รายการและยืนยันข้อมูลด้วย'):(en?'This changes the publication status. Review your note before confirming.':'คำสั่งนี้เปลี่ยนสถานะการเผยแพร่ ตรวจบันทึกก่อนยืนยัน')}</p><div className={s.buttons}><button type="button" className={s.primary} disabled={loading||(confirm==='reject'&&!note.trim())} onClick={()=>moderate(confirm)}>{loading?(en?'Saving…':'กำลังบันทึก…'):(en?'Confirm':'ยืนยัน')}</button><button type="button" className={s.secondary} disabled={loading} onClick={()=>{setConfirm(null);setError('')}}>{en?'Cancel':'ยกเลิก'}</button></div></div>:<div className={s.buttons}>{status!=='published'&&<button type="button" className={s.primary} onClick={()=>{setConfirm('approve');setMessage('')}}>{labels.approve}</button>}<button type="button" className={s.secondary} disabled={!note.trim()} onClick={()=>{setConfirm('reject');setMessage('')}}>{labels.reject}</button>{status==='published'&&<button type="button" className={s.secondary} onClick={()=>{setConfirm('archive');setMessage('')}}>{labels.archive}</button>}</div>}{error&&<p className={s.error} role="alert">{error}</p>}{message&&<p className={s.success} role="status">{message}</p>}</div>;
}
