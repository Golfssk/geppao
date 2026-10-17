'use client';
import {useEffect,useRef,useState} from 'react';
import {useRouter} from 'next/navigation';
import {useLocale} from '@/components/i18n/LocaleProvider';
import {tripStatusLabel} from '@/lib/i18n/traveler';
import styles from './TripMetadataEditor.module.css';
type Trip={id:string;title:string;status:string;travelers:number;budget_total:number|string|null;plan_revision:number;currency:string};
const draftOf=(t:Trip)=>({title:t.title,status:t.status,travelers:String(t.travelers),budget:t.budget_total==null?'':String(t.budget_total)});
export function TripMetadataEditor({trip}:{trip:Trip}){
 const {locale}=useLocale(),en=locale==='en',router=useRouter(),gate=useRef(false);
 const[base,setBase]=useState(trip.plan_revision),[draft,setDraft]=useState(()=>draftOf(trip)),[dirty,setDirty]=useState(false),[busy,setBusy]=useState(false),[blocked,setBlocked]=useState(false),[saved,setSaved]=useState(false),[message,setMessage]=useState<'conflict'|'uncertain'|'failed'|''>('');
 useEffect(()=>{if(trip.plan_revision!==base&&(!dirty||saved)&&!busy){setBase(trip.plan_revision);setDraft(draftOf(trip));setDirty(false);setSaved(false);gate.current=false}},[trip,base,dirty,saved,busy]);
 const stale=dirty&&base!==trip.plan_revision;
 const changed=draft.title.trim()!==trip.title||draft.status!==trip.status||Number(draft.travelers)!==trip.travelers||(draft.budget===''?null:Number(draft.budget))!==(trip.budget_total==null?null:Number(trip.budget_total));
 function change(key:keyof typeof draft,value:string){setDraft(d=>({...d,[key]:value}));setDirty(true)}
 async function save(e:React.FormEvent){
  e.preventDefault();if(gate.current||blocked||stale||!dirty||!changed)return;gate.current=true;setBusy(true);setMessage('');
  try{
   const response=await fetch(`/api/trips/${trip.id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({expectedVersion:base,title:draft.title,status:draft.status,travelers:Number(draft.travelers),budgetTotal:draft.budget===''?null:Number(draft.budget)})});
   const body=await response.json().catch(()=>null);
   if(!response.ok||body?.success!==true){setMessage(response.status===409||response.status===428?'conflict':'failed');setBlocked(true);return}
   setSaved(true);router.refresh();
  }catch{setMessage('uncertain');setBlocked(true)}finally{setBusy(false)}
 }
 const error=stale?'conflict':message;
 return <details className={styles.panel}><summary>{en?'Trip settings':'ตั้งค่าทริป'} <span>{en?'Owner only':'สำหรับเจ้าของทริป'}</span></summary><form onSubmit={save} className={styles.form}>
 <p className={styles.note}>{en?'Update the name, status, travelers or budget. Changing travelers clears cached calculations; recalculate the itinerary afterwards. Dates and destinations are not changed here.':'แก้ชื่อ สถานะ จำนวนคน และงบได้ เมื่อเปลี่ยนจำนวนคน ผลคำนวณเดิมจะถูกล้าง กรุณาคำนวณแผนใหม่ ส่วนนี้ไม่เปลี่ยนวันเดินทางหรือจุดหมาย'}</p>
 <fieldset disabled={busy||blocked||stale||saved} className={styles.fields}>
 <label>{en?'Trip name':'ชื่อทริป'}<input required maxLength={160} value={draft.title} onChange={e=>change('title',e.target.value)}/></label>
 <label>{en?'Status':'สถานะ'}<select value={draft.status} onChange={e=>change('status',e.target.value)}>{['draft','planned','active','completed','archived'].map(s=><option key={s} value={s}>{tripStatusLabel(s,locale)}</option>)}</select></label>
 <label>{en?'Travelers':'จำนวนผู้เดินทาง'}<input type="number" required min={1} max={100} step={1} value={draft.travelers} onChange={e=>change('travelers',e.target.value)}/></label>
 <label>{en?'Total budget':'งบรวม'} ({trip.currency})<input type="number" min={0} max={100000000} step="0.01" value={draft.budget} onChange={e=>change('budget',e.target.value)}/></label>
 </fieldset>
 <div className={styles.actions}><button className="btn btn-rust" disabled={!dirty||!changed||busy||blocked||stale||saved} type="submit">{busy?(en?'Saving…':'กำลังบันทึก…'):(en?'Save changes':'บันทึกการเปลี่ยนแปลง')}</button>{(dirty||blocked||saved)&&<button className="btn btn-outline" type="button" disabled={busy} onClick={()=>{if(window.confirm(en?'Reload the whole trip? Unsaved changes on this page will be discarded.':'โหลดทั้งทริปใหม่หรือไม่? การแก้ไขที่ยังไม่บันทึกบนหน้านี้จะหายไป'))window.location.reload()}}>{en?'Reload latest trip':'โหลดทริปล่าสุด'}</button>}</div>
 {saved&&<p role="status">{en?'Saved. Refreshing the latest trip…':'บันทึกแล้ว กำลังโหลดข้อมูลล่าสุด…'}</p>}
 {error&&<p role="alert" className={styles.error}>{error==='conflict'?(en?'This trip changed. Your draft is kept here. Copy it if needed, then reload before saving.':'ทริปมีการเปลี่ยนแปลง ร่างของคุณยังอยู่ คัดลอกเก็บไว้หากต้องการ แล้วโหลดใหม่ก่อนบันทึก'):error==='uncertain'?(en?'Connection interrupted. The save may have completed. Reload to check; do not resend blindly.':'การเชื่อมต่อขัดข้อง การบันทึกอาจสำเร็จแล้ว กรุณาโหลดใหม่เพื่อตรวจสอบ ไม่ส่งซ้ำทันที'):(en?'Save not confirmed. Your draft is kept. Reload to verify the latest trip before trying again.':'ยังยืนยันการบันทึกไม่ได้ ร่างของคุณยังอยู่ กรุณาโหลดใหม่เพื่อตรวจสถานะก่อนลองอีกครั้ง')}</p>}
 {error&&<label className={styles.copyDraft}>{en?'Your draft — copy before reloading':'ร่างของคุณ — คัดลอกก่อนโหลดใหม่'}<textarea readOnly rows={5} value={`${draft.title}\n${tripStatusLabel(draft.status,locale)}\n${en?'Travelers':'จำนวนคน'}: ${draft.travelers}\n${en?'Budget':'งบ'} (${trip.currency}): ${draft.budget||(en?'Not set':'ไม่ระบุ')}`} onFocus={e=>e.currentTarget.select()}/></label>}
 </form></details>;
}
