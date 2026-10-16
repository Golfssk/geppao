'use client';
import {useEffect,useState} from 'react';
import {schedulePatch,thaiTime} from '@/lib/planner/request';
type Props={item:any;serviceDate:string;disabled:boolean;onSave:(body:any)=>Promise<void>};
export function TripItemSchedule({item,serviceDate,disabled,onSave}:Props){
 const [time,setTime]=useState(thaiTime(item.starts_at)),[duration,setDuration]=useState(String(item.duration_minutes??'')),[error,setError]=useState('');
 useEffect(()=>{setTime(thaiTime(item.starts_at));setDuration(String(item.duration_minutes??''))},[item.starts_at,item.duration_minutes]);
 const changed=time!==thaiTime(item.starts_at)||duration!==String(item.duration_minutes??'');
 async function save(){const patch=schedulePatch(serviceDate,time,Number(duration));if(!patch){setError('กรุณาระบุเวลาเริ่มและระยะเวลา 1–1,440 นาที');return}setError('');await onSave({itemId:item.id,...patch})}
 return <div className="trip-schedule"><label>เวลาเริ่ม (ไทย)<input aria-label={'เวลาเริ่ม '+item.id} type="time" value={time} disabled={disabled} onChange={e=>setTime(e.target.value)}/></label><label>ระยะเวลา (นาที)<input aria-label={'ระยะเวลา '+item.id} type="number" min="1" max="1440" value={duration} disabled={disabled} onChange={e=>setDuration(e.target.value)}/></label><button className="btn btn-rust" disabled={disabled||!changed} onClick={save}>บันทึกเวลา</button>{error&&<p role="alert">{error}</p>}<small>เวลาโดยประมาณ ปรับแล้วกดคำนวณทริปใหม่เพื่อตรวจช่วงเปิดและเวลาที่ทับซ้อน</small></div>;
}
