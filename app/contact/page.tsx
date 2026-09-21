import type {Metadata} from 'next';
import styles from './Contact.module.css';

export const metadata:Metadata={title:'ติดต่อเรา'};
const email='natthapatee.r@gmail.com';

export default function ContactPage(){return <main className="page"><section className={styles.hero}><div className={styles.inner}><p className="eyebrow">CONTACT GEPPAO</p><h1>คุยกับผู้ดูแล GepPao โดยตรง</h1><p>สอบถามการใช้งาน แจ้งข้อมูลสถานที่ หรือสมัครลงทะเบียนที่พักฟรีได้ทางอีเมลส่วนตัว เราจะอ่านและตอบกลับด้วยตัวเอง</p><div className={styles.actions}><a className="btn btn-primary" href={`mailto:${email}?subject=${encodeURIComponent('ติดต่อ GepPao')}`}>ส่งอีเมลถึงผู้ดูแล</a><a className="btn btn-outline" href={`mailto:${email}?subject=${encodeURIComponent('สมัครลงทะเบียนที่พักฟรีกับ GepPao')}`}>ลงทะเบียนที่พักฟรี</a></div><div className={styles.card}><span>อีเมล</span><a href={`mailto:${email}`}>{email}</a><p>เพื่อความรวดเร็ว กรุณาระบุชื่อ สถานที่ และช่องทางติดต่อกลับในอีเมล</p></div></div></section></main>}
