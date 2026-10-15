'use client';
import {useLocale} from '@/components/i18n/LocaleProvider';
import styles from './DemoNotice.module.css';
export function DemoNotice(){const {locale}=useLocale();return <aside className={styles.notice} aria-label={locale==='en'?'Demo notice':'แจ้งข้อมูลจำลอง'}><strong>{locale==='en'?'DEMO · Synthetic data only':'DEMO · ข้อมูลจำลองเท่านั้น'}</strong><span>{locale==='en'?'Names, prices and verification badges are fictional examples. No real availability, booking, payment or production database write.':'ชื่อที่พัก ราคา และป้ายยืนยันเป็นตัวอย่างสมมติ ไม่ใช่ห้องว่างจริง ไม่รับจองหรือชำระเงิน และไม่เขียนฐานข้อมูล production'}</span></aside>}
