'use client';
import {useEffect,useState} from 'react';
import {useLocale} from '@/components/i18n/LocaleProvider';
export function TripItemNotes({item,disabled,onSave}:{item:any;disabled:boolean;onSave:(body:any)=>Promise<void>}){
 const {locale}=useLocale(),en=locale==='en';const [notes,setNotes]=useState(item.notes||'');
 useEffect(()=>setNotes(item.notes||''),[item.notes]);
 return <details className="trip-note"><summary>{en?'Notes · members only':'โน้ต · เฉพาะสมาชิกทริป'}{item.notes?' •':''}</summary><label htmlFor={`notes-${item.id}`}>{en?'Meeting point, reminders or booking instructions':'จุดนัดพบ สิ่งที่ต้องเตรียม หรือรายละเอียดเตือนความจำ'}</label><textarea id={`notes-${item.id}`} value={notes} maxLength={2000} rows={3} disabled={disabled} onChange={e=>setNotes(e.target.value)}/><small>{notes.length}/2,000 · {en?'Not included in the public share page':'ไม่แสดงบนหน้าแชร์สาธารณะ'}</small><button className="btn" disabled={disabled||notes===(item.notes||'')} onClick={()=>onSave({itemId:item.id,notes})}>{en?'Save notes':'บันทึกโน้ต'}</button></details>;
}
