import type {Metadata} from 'next';
import Link from 'next/link';
import {createClient} from '@/lib/supabase/server';
import {mapArticle} from '@/lib/editorial';
import {ThailandExplorer} from '@/components/destinations/ThailandExplorer';
import {EditorialCard} from '@/components/editorial/EditorialCard';
import {TravelTrustBand} from '@/components/home/TravelTrustBand';
import {HostCTA} from '@/components/home/HostCTA';
import styles from '@/components/home/EditorialHome.module.css';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:{absolute:'GepPao | เก็บเป๋า ไปไหนดี? เริ่มทริปจากที่ที่อยากไป'},description:'สำรวจประเทศไทย 77 จังหวัด ค้นหาที่พัก ร้านอาหาร คาเฟ่ และที่เที่ยว แล้วต่อเป็นแผนทริปของคุณใน GepPao',alternates:{canonical:'https://geppao.vercel.app'}};
export default async function Home(){
 const supabase=await createClient();
 const articleResult=await supabase.from('articles').select('id,title,slug,excerpt,category,tags,cover_image_url,cover_alt_text,cover_approved_for_public,reading_minutes,is_featured,commercial_type,sponsor_name,published_at,destinations(name,slug),editorial_authors(display_name,slug)').eq('publication_status','published').lte('published_at',new Date().toISOString()).order('is_featured',{ascending:false}).order('published_at',{ascending:false}).limit(6);
 const articles=(articleResult.data??[]).map(mapArticle);
 return <main>
  <ThailandExplorer/>
  <section className={styles.funnel}><div className={styles.funnelInner}><div><span className="eyebrow">From story to trip</span><h2>เจอไอเดียที่ชอบแล้ว อย่าหยุดแค่การบันทึกโพสต์</h2><p>ส่งต่อ Destination และความสนใจเข้า Planner เพื่อสร้างทริป บันทึก แก้ไข และแชร์ได้ในที่เดียว</p></div><Link href="/planner" className="btn btn-primary">เริ่มวางแผนทริป</Link></div></section>
  <TravelTrustBand/><HostCTA/>
  <section className={styles.section}><div className={styles.head}><div><span className="eyebrow">Latest stories</span><h2>เรื่องใหม่จาก GepPao</h2><p>คู่มือ ไอเดียทริป ข่าว และเรื่องเล่าท้องถิ่น</p></div><Link href="/stories" className={styles.textLink}>ดูทั้งหมด →</Link></div><div className={styles.storyGrid}>{articles.length?articles.map((article,index)=><EditorialCard key={article.id} article={article} featured={index===0}/>):<div className={styles.emptyStories}><span className="eyebrow">Editorial desk</span><h3>กำลังเตรียมบทความชุดแรก</h3><p>ระบบบทความพร้อมใช้งานแล้ว เนื้อหาจะเผยแพร่เมื่อผ่านการตรวจข้อเท็จจริง แหล่งที่มา และสิทธิ์สื่อเท่านั้น ระหว่างนี้เริ่มสำรวจข้อมูลสถานที่และ Planner เขาใหญ่ได้เลย</p></div>}</div></section>
  <p className={styles.footnote}>บทความเชิงพาณิชย์และลิงก์ Affiliate จะมีป้ายกำกับชัดเจน และไม่เปลี่ยนอันดับ Organic Recommendation ของ Planner</p>
 </main>
}
