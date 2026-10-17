 'use client';
import {useEffect,useState} from 'react';
import {useLocale} from '@/components/i18n/LocaleProvider';
export function TripItemNotes({item,disabled,onSave}:{item:any;disabled:boolean;onSave:(body:any)=>Promise<boolean|void>}){
 const {locale}=useLocale(),en=locale==='en';const [notes,setNotes]=useState(item.notes||''),[dirty,setDirty]=useState(false),[version,setVersion]=useState(item._planRevision);
 useEffect(()=>{if(!dirty){setNotes(item.notes||'');setVersion(item._planRevision)}},[item.notes,item._planRevision,dirty]);
 const conflict=dirty&&version!==item._planRevision;
 return <details className="trip-note"><summary>{en?'Notes · members only':'โน้ต · เฉพาะสมาชิกทริป'}{item.notes?' •':''}</summary><label htmlFor={`notes-${item.id}`}>{en?'Meeting point, reminders or booking instructions':'จุดนัดพบ สิ่งที่ต้องเตรียม หรือรายละเอียดเตือนความจำ'}</label><textarea id={`notes-${item.id}`} value={notes} maxLength={2000} rows={3} disabled={disabled} onChange={e=>{setDirty(true);setNotes(e.target.value)}}/><small>{notes.length}/2,000 · {en?'Not included in the public share page':'ไม่แสดงบนหน้าแชร์สาธารณะ'}</small>{conflict&&<p role="alert">{en?'The plan changed. Your draft is kept but cannot overwrite the newer version.':'แผนเปลี่ยนแล้ว เก็บข้อความร่างไว้ แต่ยังบันทึกทับข้อมูลใหม่ไม่ได้'}</p>}<button className="btn" disabled={disabled||conflict||!dirty} onClick={async()=>{if(await onSave({itemId:item.id,notes,expectedVersion:version}))setDirty(false)}}>{en?'Save notes':'บันทึกโน้ต'}</button>{conflict&&<button className="btn" onClick={()=>{if(window.confirm(en?'Discard this draft and use the latest saved note?':'ทิ้งข้อความร่างนี้และใช้โน้ตที่บันทึกล่าสุดหรือไม่?'))setDirty(false)}}>{en?'Use latest saved note':'ใช้โน้ตที่บันทึกล่าสุด'}</button>}</details>;
}
