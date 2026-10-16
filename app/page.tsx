import type {Metadata} from 'next';
import Link from 'next/link';
import {ThailandExplorer} from '@/components/destinations/ThailandExplorer';
import {TravelTrustBand} from '@/components/home/TravelTrustBand';
import {HostCTA} from '@/components/home/HostCTA';
import styles from '@/components/home/EditorialHome.module.css';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:{absolute:'GepPao | เก็บเป๋า ไปไหนดี? เริ่มทริปจากที่ที่อยากไป'},description:'สำรวจประเทศไทย 77 จังหวัด ค้นหาที่พัก ร้านอาหาร คาเฟ่ และที่เที่ยว แล้วต่อเป็นแผนทริปของคุณใน GepPao',alternates:{canonical:'https://geppao.vercel.app'}};
export default function Home(){
 return <main>
  <ThailandExplorer/>
  <section className={styles.funnel}><div className={styles.funnelInner}><div><span className="eyebrow">Your next journey</span><h2>เจอที่ที่อยากไปแล้ว มาจัดทริปกัน</h2><p>เลือกวันเดินทาง จัดแผนจากสถานที่จริง แล้วบันทึกไว้แก้ไขและเปิดนำทางได้</p></div><Link href="/planner" className="btn btn-rust">เริ่มวางแผนทริป →</Link></div></section>
  <TravelTrustBand/><HostCTA/>
 </main>
}
