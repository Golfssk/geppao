'use client';
import {useState} from 'react';
import {publicTripSummary} from '@/lib/planner/share-summary';
export function PublicTripShare({trip}:{trip:any}){
 const[message,setMessage]=useState(''),[manual,setManual]=useState('');
 return <section className="dashboard-card" aria-label="ส่งสรุปทริป"><h2>ส่งแผนให้เพื่อน</h2><p className="muted">แชร์เฉพาะแผนสาธารณะ ไม่รวมโน้ตส่วนตัว สมาชิก รายจ่าย หรือข้อมูลการจอง</p><div className="form-actions"><button className="btn btn-primary" onClick={async()=>{const text=publicTripSummary(trip,location.origin+location.pathname);try{await navigator.clipboard.writeText(text);setManual('');setMessage('คัดลอกสรุปแล้ว วางส่งใน LINE ได้เลย')}catch{setManual(text);setMessage('เลือกข้อความด้านล่างเพื่อคัดลอกเอง')}}}>คัดลอกสรุปส่ง LINE</button><button className="btn btn-sage" onClick={()=>{const url='https://social-plugins.line.me/lineit/share?url='+encodeURIComponent(location.origin+location.pathname);window.open(url,'_blank','noopener,noreferrer')}}>เปิด LINE เพื่อส่งลิงก์ ↗</button></div>{message&&<p role="status">{message}</p>}{manual&&<label className="form-field">สรุปแผนสาธารณะ<textarea readOnly value={manual} onFocus={e=>e.target.select()} /></label>}<p className="muted">ทุกคนที่ได้รับลิงก์อ่านแผนได้ เจ้าของสามารถปิดลิงก์ได้จากหน้าทริป</p></section>
}
