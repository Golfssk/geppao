'use client';
import {ChangeEvent,useState} from 'react';
type Image={id:string;image_url:string;sort_order:number;is_cover:boolean;alt_text:string|null;approved_for_public?:boolean};
export function PlaceImageManager({placeId,initialImages}:{placeId:string;initialImages:Image[]}){
  const[images,setImages]=useState(initialImages),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const[rightsHolder,setRightsHolder]=useState(''),[rightsConfirmed,setRightsConfirmed]=useState(false);
  async function upload(e:ChangeEvent<HTMLInputElement>){
    const files=Array.from(e.target.files??[]);
    if(!rightsConfirmed||!rightsHolder.trim()){setError('กรุณาระบุเจ้าของสิทธิ์และยืนยันสิทธิ์ก่อนอัปโหลด');e.target.value='';return}
    setBusy(true);setError('');
    try{for(const file of files){const form=new FormData();form.append('file',file);form.append('rightsHolder',rightsHolder.trim());form.append('rightsConfirmed','true');form.append('permissionEvidence','owner_dashboard_upload');const r=await fetch(`/api/business/places/${placeId}/images`,{method:'POST',body:form}),x=await r.json();if(!r.ok)throw new Error(x.error);setImages(v=>[...v,x])}}
    catch(x){setError(x instanceof Error?x.message:'อัปโหลดไม่สำเร็จ')}
    finally{setBusy(false);e.target.value=''}
  }
  async function action(method:'PATCH'|'DELETE',imageId:string){const r=await fetch(`/api/business/places/${placeId}/images`,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify({imageId})}),x=await r.json();if(!r.ok){setError(x.error);return}if(method==='DELETE')setImages(v=>v.filter(i=>i.id!==imageId));else setImages(v=>v.map(i=>({...i,is_cover:i.id===imageId})));}
  return <section className="dashboard-card"><div className="section-head"><div><h2>รูปภาพ Place</h2><p className="muted">รูปใหม่จะยังไม่แสดงสาธารณะจนกว่า Admin จะตรวจหลักฐานและอนุมัติ</p></div><label className="btn btn-primary">{busy?'กำลังอัปโหลด':'เพิ่มรูป'}<input hidden multiple type="file" accept="image/jpeg,image/png,image/webp" onChange={upload}/></label></div><div className="form-grid"><label>เจ้าของลิขสิทธิ์/ผู้ให้สิทธิ์<input value={rightsHolder} onChange={e=>setRightsHolder(e.target.value)} placeholder="ชื่อธุรกิจหรือเจ้าของภาพ"/></label><label><input type="checkbox" checked={rightsConfirmed} onChange={e=>setRightsConfirmed(e.target.checked)}/> ยืนยันว่ามีอำนาจอนุญาตให้ GepPao จัดเก็บ ปรับขนาด และแสดงรูปนี้</label></div><div className="place-image-grid">{images.map(i=><article key={i.id}><img src={i.image_url} alt={i.alt_text??'รูปสถานที่'}/><p className="muted">{i.approved_for_public?'อนุมัติให้แสดงแล้ว':'รอ Admin ตรวจสิทธิ์'}</p><div className="image-actions"><button className="btn" onClick={()=>action('PATCH',i.id)}>{i.is_cover?'รูปปก ✓':'ตั้งเป็นปก'}</button><button className="btn" onClick={()=>action('DELETE',i.id)}>ลบ</button></div></article>)}</div>{!images.length&&<p className="muted">ยังไม่มีรูปภาพใน Place model</p>}{error&&<p className="form-error">{error}</p>}</section>
}
