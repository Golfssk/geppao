'use client';
import {useLocale} from '@/components/i18n/LocaleProvider';
import {useRouter} from 'next/navigation';
import {useRef,useState} from 'react';
import styles from './Trips.module.css';
export function DeleteTripButton({tripId,title,expectedVersion}:{tripId:string;title:string;expectedVersion:number}){
 const router=useRouter(),{locale}=useLocale(),en=locale==='en',inFlight=useRef(false);
 const[busy,setBusy]=useState(false),[blocked,setBlocked]=useState(false),[error,setError]=useState('');
 async function remove(){
  if(inFlight.current||blocked)return;
  if(!window.confirm(en?`Permanently delete “${title}”? This removes its itinerary, members, shared links, expenses, checklists, polls and reservation records, including other members’ records. It cannot be undone. Reload first if anyone is editing the trip.`:`ลบทริป “${title}” ถาวรหรือไม่? แผน สมาชิก ลิงก์แชร์ ค่าใช้จ่าย เช็กลิสต์ โพล และข้อมูลการจอง รวมถึงข้อมูลของเพื่อนจะถูกลบและกู้คืนจากหน้านี้ไม่ได้ หากมีคนกำลังแก้ไข ให้โหลดใหม่ก่อน`))return;
  inFlight.current=true;setBusy(true);setError('');
  try{
   const response=await fetch(`/api/trips/${tripId}`,{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({expectedVersion})});
   const body=await response.json().catch(()=>null);
   if(!response.ok||body?.success!==true){setBlocked(true);setError(en?'Deletion not confirmed. Reload to check the latest trip before trying again.':'ยังยืนยันการลบไม่ได้ กรุณาโหลดใหม่เพื่อตรวจสถานะล่าสุดก่อนลองอีกครั้ง');return}
   router.refresh();
  }catch{setBlocked(true);setError(en?'Connection interrupted. Deletion may have completed. Reload to check before trying again.':'การเชื่อมต่อขัดข้อง การลบอาจสำเร็จแล้ว กรุณาโหลดใหม่เพื่อตรวจสอบก่อนลองอีกครั้ง')}
  finally{setBusy(false)}
 }
 return <div className={styles.deleteWrap}><button className={styles.deleteButton} type="button" onClick={remove} disabled={busy||blocked||inFlight.current}>{busy?(en?'Deleting…':'กำลังลบ...'):(en?'Delete trip':'ลบทริป')}</button>{error&&<span className={styles.deleteError} role="alert">{error} <button type="button" onClick={()=>window.location.reload()}>{en?'Reload':'โหลดใหม่'}</button></span>}</div>;
}
