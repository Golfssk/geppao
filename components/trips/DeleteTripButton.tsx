'use client';
import {useRouter} from 'next/navigation';
import {useState} from 'react';
import styles from './Trips.module.css';
export function DeleteTripButton({tripId,title}:{tripId:string;title:string}){const router=useRouter();const[busy,setBusy]=useState(false);const[error,setError]=useState('');async function remove(){if(!window.confirm(`ลบทริป “${title}” ใช่หรือไม่? การลบนี้ไม่สามารถย้อนกลับได้`))return;setBusy(true);setError('');try{const response=await fetch(`/api/trips/${tripId}`,{method:'DELETE'});const body=await response.json().catch(()=>null);if(!response.ok)throw new Error(body?.error||'ไม่สามารถลบทริปได้');router.refresh()}catch(e){setError(e instanceof Error?e.message:'ไม่สามารถลบทริปได้');setBusy(false)}}return <div className={styles.deleteWrap}><button className={styles.deleteButton} type="button" onClick={remove} disabled={busy}>{busy?'กำลังลบ...':'ลบทริป'}</button>{error&&<span className={styles.deleteError} role="alert">{error}</span>}</div>}
