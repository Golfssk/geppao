'use client';
import Link from 'next/link';
import {useLocale} from '@/components/i18n/LocaleProvider';
import styles from './EditorialHome.module.css';
export function HomePlannerCTA(){const en=useLocale().locale==='en';return <section className={styles.funnel}><div className={styles.funnelInner}><div><span className="eyebrow">{en?'Your next journey':'ทริปต่อไปของคุณ'}</span><h2>{en?'Found somewhere you love? Make it a trip.':'เจอที่ที่อยากไปแล้ว มาจัดทริปกัน'}</h2><p>{en?'Choose your dates, plan with published places, then save, edit and open directions.':'เลือกวันเดินทาง จัดแผนจากสถานที่จริง แล้วบันทึกไว้แก้ไขและเปิดนำทางได้'}</p></div><Link href="/planner" className="btn btn-rust">{en?'Start planning →':'เริ่มวางแผนทริป →'}</Link></div></section>}
