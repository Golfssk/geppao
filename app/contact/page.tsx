import type {Metadata} from 'next';
import {ContactForm} from '@/components/contact/ContactForm';
import styles from './Contact.module.css';

export const metadata:Metadata={title:'ติดต่อเรา'};

export default function ContactPage(){return <main className="page"><section className={styles.hero}><div className={styles.intro}><p className="eyebrow">CONTACT GEPPAO</p><h1>ติดต่อ GepPao</h1><p>กรอกข้อมูลด้านล่างเพื่อสอบถามการใช้งาน แจ้งข้อมูลสถานที่ หรือสมัครลงทะเบียนที่พักฟรี</p></div></section><section className={styles.section}><div className={styles.layout}><aside className={styles.summary}><span className={styles.badge}>ติดต่อโดยตรง</span><h2>เล่าให้เราฟังว่าต้องการความช่วยเหลือเรื่องอะไร</h2><p>ทีม GepPao จะใช้ข้อมูลนี้เพื่อติดต่อกลับเกี่ยวกับคำขอของคุณเท่านั้น</p><ul><li>สอบถามการใช้งาน GepPao</li><li>แจ้งหรือแก้ไขข้อมูลสถานที่</li><li>ลงทะเบียนที่พักหรือธุรกิจท้องถิ่น</li></ul></aside><ContactForm/></div></section></main>}
