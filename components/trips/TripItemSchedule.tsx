 'use client';
import {useLocale} from '@/components/i18n/LocaleProvider';
import {travelerText} from '@/lib/i18n/traveler';
import {useEffect,useState} from 'react';
import {schedulePatch,thaiTime} from '@/lib/planner/request';
type Props={item:any;serviceDate:string;disabled:boolean;onSave:(body:any)=>Promise<boolean|void>};
export function TripItemSchedule({item,serviceDate,disabled,onSave}:Props){
 const {locale}=useLocale(),t=(value:string)=>travelerText(value,locale),en=locale==='en';
 const [time,setTime]=useState(thaiTime(item.starts_at)),[duration,setDuration]=useState(String(item.duration_minutes??'')),[error,setError]=useState(''),[dirty,setDirty]=useState(false),[version,setVersion]=useState(item._planRevision);
 useEffect(()=>{if(!dirty){setTime(thaiTime(item.starts_at));setDuration(String(item.duration_minutes??''));setVersion(item._planRevision)}},[item.starts_at,item.duration_minutes,item._planRevision,dirty]);
 const conflict=dirty&&version!==item._planRevision;
 async function save(){const patch=schedulePatch(serviceDate,time,Number(duration));if(!patch){setError('กรุณาระบุเวลาเริ่มและระยะเวลา 1–1,440 นาที');return}setError('');if(await onSave({itemId:item.id,...patch,expectedVersion:version}))setDirty(false)}
 return <div className="trip-schedule"><label>{t('เวลาเริ่ม (ไทย)')}<input aria-label={t('เวลาเริ่ม ')+item.id} type="time" value={time} disabled={disabled} onChange={e=>{setDirty(true);setTime(e.target.value)}}/></label><label>{t('ระยะเวลา (นาที)')}<input aria-label={t('ระยะเวลา ')+item.id} type="number" min="1" max="1440" value={duration} disabled={disabled} onChange={e=>{setDirty(true);setDuration(e.target.value)}}/></label><button className="btn btn-rust" disabled={disabled||conflict||!dirty} onClick={save}>{t('บันทึกเวลา')}</button>{conflict&&<p role="alert">{en?'The plan changed. Your draft is kept; review the latest plan before saving.':'แผนเปลี่ยนแล้ว เก็บเวลาที่ร่างไว้ กรุณาตรวจแผนล่าสุดก่อนบันทึก'}</p>}{conflict&&<button className="btn" onClick={()=>{if(window.confirm(en?'Discard this draft and use the latest saved time?':'ทิ้งเวลาที่ร่างและใช้เวลาที่บันทึกล่าสุดหรือไม่?'))setDirty(false)}}>{en?'Use latest saved time':'ใช้เวลาที่บันทึกล่าสุด'}</button>}{error&&<p role="alert">{t(error)}</p>}<small>{t('เวลาโดยประมาณ ปรับแล้วกดคำนวณทริปใหม่เพื่อตรวจช่วงเปิดและเวลาที่ทับซ้อน')}</small></div>;
}
