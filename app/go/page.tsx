import type {Metadata} from 'next';
import Link from 'next/link';
import {destinations} from '@/lib/editorial';
import styles from './go.module.css';
export const metadata:Metadata={title:'เก็บเป๋า ไปไหน?',description:'เลือกจุดหมายและเปลี่ยนไอเดียให้เป็นทริปที่วางแผนได้จริงกับ GepPao'};
export default function GoPage(){return <main className={styles.page}><header><span className="eyebrow">Destination intelligence</span><h1>เก็บเป๋า ไปไหน?</h1><p>เลือกจุดหมาย อ่านเรื่องที่ควรรู้ แล้วสร้างทริปจากข้อมูลที่พร้อมใช้งานจริง</p></header><div className={styles.grid}>{destinations.map((item,index)=><Link href={`/go/${item.slug}`} key={item.slug} className={styles.card} style={{'--accent':item.accent} as React.CSSProperties}><span className={styles.index}>0{index+1}</span><div><small>{item.province}</small><h2>{item.name}</h2><p>{item.kicker}</p><p className={styles.summary}>{item.summary}</p></div><span className={styles.cta}>{item.plannerReady?'เปิดคู่มือและ Planner':'ดูพื้นที่เตรียมการ'} →</span></Link>)}</div></main>}
