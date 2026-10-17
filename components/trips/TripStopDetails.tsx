'use client';
import {useRef,useEffect,useState} from 'react';
import {createPortal} from 'react-dom';
import {useLocale} from '@/components/i18n/LocaleProvider';
export function TripStopDetails({item}:{item:any}){
 const ref=useRef<HTMLDialogElement>(null),{locale}=useLocale(),en=locale==='en',place=item.places||item.events;
 const[mounted,setMounted]=useState(false);useEffect(()=>setMounted(true),[]);
 if(!place)return null;return <><button type="button" className="btn btn-sage trip-stop-details-button" onClick={()=>ref.current?.showModal()}>{en?'Stop details':'รายละเอียดจุดแวะ'}</button>{mounted&&createPortal(<dialog className="trip-stop-dialog" ref={ref} aria-label={en?'Stop details':'รายละเอียดจุดแวะ'} onClick={e=>{if(e.target===e.currentTarget)ref.current?.close()}}><div className="section-head"><h2>{place.name}</h2><button type="button" className="btn" autoFocus onClick={()=>ref.current?.close()}>{en?'Close':'ปิด'}</button></div><p>{place.address||place.temporary_venue_name||(en?'Address not recorded':'ยังไม่มีที่อยู่ที่บันทึกไว้')}</p><p className="muted">{en?'Recorded coordinates: ':'พิกัดที่บันทึก: '}{place.latitude!=null&&place.longitude!=null?`${place.latitude}, ${place.longitude}`:(en?'Not recorded':'ยังไม่มีข้อมูล')}</p><p className="muted">{en?'This summary uses saved directory fields. Check current opening hours, prices and conditions with the venue.':'สรุปจากข้อมูลสถานที่ที่บันทึกไว้ โปรดตรวจเวลาเปิด ราคา และเงื่อนไขล่าสุดกับกิจการ'}</p>{place.slug&&<a className="btn" href={`/${item.places?'places':'events'}/${encodeURIComponent(place.slug)}`} target="_blank" rel="noreferrer">{en?'Full details in a new tab ↗':'เปิดรายละเอียดเต็มในแท็บใหม่ ↗'}</a>}</dialog>,document.body)}</>;
}
