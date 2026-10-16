 'use client';
import {useState} from 'react';
export function PublishWorkbookButton({batch}:{batch:string}){
 const[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 async function publish(){if(!window.confirm('นำข้อมูลพื้นฐานจากไฟล์ไปใช้บนเว็บจริง? ระบบตรวจซ้ำก่อนสร้างสถานที่ และจะไม่เพิ่มรูป ข้อความรีวิว หรืออ้างว่ายืนยันกับเจ้าของแล้ว'))return;setBusy(true);setMessage('กำลังตรวจซ้ำและนำข้อมูลขึ้นเว็บ…');try{const response=await fetch(`/api/admin/imports/workbooks/${batch}/publish`,{method:'POST'}),data=await response.json();if(!response.ok)throw new Error(data.error||'เผยแพร่ไม่สำเร็จ');window.location.reload()}catch(e){setMessage(e instanceof Error?e.message:'เผยแพร่ไม่สำเร็จ');setBusy(false)}}
 return <div><button type="button" onClick={publish} disabled={busy} style={{minHeight:48,padding:'12px 20px',background:'#174e35',color:'white',border:0,borderRadius:8,fontWeight:700,cursor:'pointer'}}>{busy?'กำลังนำขึ้นเว็บ…':'นำรายการที่เหลือไปใช้บนเว็บ'}</button>{message&&<p role="status">{message}</p>}</div>;
}
