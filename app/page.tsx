import Link from 'next/link';
import {createClient} from '@/lib/supabase/server';
import {mapPlace} from '@/lib/places';
import {destinations,mapArticle} from '@/lib/editorial';
import {EditorialCard} from '@/components/editorial/EditorialCard';
import {HomeCategoryCarousel} from '@/components/home/HomeCategoryCarousel';
import {TravelTrustBand} from '@/components/home/TravelTrustBand';
import {HostCTA} from '@/components/home/HostCTA';
import styles from '@/components/home/EditorialHome.module.css';
export const dynamic='force-dynamic';
export default async function Home(){
 const supabase=await createClient();
 const [articleResult,placeResult]=await Promise.all([
  supabase.from('articles').select('id,title,slug,excerpt,category,tags,cover_image_url,cover_alt_text,cover_approved_for_public,reading_minutes,is_featured,commercial_type,sponsor_name,published_at,destinations(name,slug),editorial_authors(display_name,slug)').eq('publication_status','published').lte('published_at',new Date().toISOString()).order('is_featured',{ascending:false}).order('published_at',{ascending:false}).limit(6),
  supabase.from('places').select('*, place_images(id,image_url,alt_text,sort_order,is_cover), price_items(id,label,amount_min,amount_max,currency,price_unit,is_estimate)').eq('publication_status','published').order('name').limit(100)
 ]);
 const articles=(articleResult.data??[]).map(mapArticle);
 const places=(placeResult.data??[]).map(mapPlace);
 return <main>
  <section className={styles.hero}><div className={styles.heroGrid}>
   <div className={styles.heroStory}><div><span className={styles.eyebrow}>GepPao · Travel stories with a useful next step</span><h1>เที่ยวให้มีเรื่องเล่า<br/>วางแผนให้ไปได้จริง</h1><p>อ่านไอเดียท่องเที่ยวจากพื้นที่ แล้วเปลี่ยนแรงบันดาลใจให้เป็นทริปที่มีเส้นทาง เวลา และข้อมูลที่ตรวจสอบได้</p></div><div className={styles.actions}><Link href="/go" className={styles.primary}>เก็บเป๋า ไปไหน?</Link><Link href="/stories" className={styles.secondary}>อ่านเรื่องล่าสุด</Link></div></div>
   <aside className={styles.plannerPanel}><div><div className={styles.number}>01</div><span className="eyebrow">Trip intelligence</span><h2>เริ่มจากเขาใหญ่ แล้วค่อยไปให้ไกลขึ้น</h2><p>เลือกจุดหมาย สไตล์ จำนวนวัน และงบ จากนั้นให้ Planner ช่วยจัดทริปจากข้อมูลที่มีอยู่จริง</p></div><Link href="/planner" className={styles.plannerLink}><span>เปิด Planner</span><span aria-hidden>→</span></Link></aside>
  </div></section>
  <section className={styles.section}><div className={styles.head}><div><span className="eyebrow">Destinations</span><h2>เก็บเป๋า ไปไหน?</h2><p>เริ่มจากจุดหมายใกล้กรุงเทพฯ และขยายเมื่อข้อมูลพร้อม</p></div><Link href="/go" className={styles.textLink}>ดูทุกจุดหมาย →</Link></div><div className={styles.destinations}>{destinations.map(item=><Link key={item.slug} href={`/go/${item.slug}`} className={styles.destination} style={{backgroundColor:item.accent,backgroundImage:`linear-gradient(180deg,rgba(6,27,17,.15),rgba(6,27,17,.88)),url(${item.imageSrc})`}}><div><small>{item.province}</small><h3>{item.name}</h3><p>{item.kicker}</p></div><span className={styles.status}>{item.plannerReady?'Planner พร้อม':'กำลังเตรียมข้อมูล'}</span></Link>)}</div><p className={styles.imageCredits}>ภาพจุดหมาย: {destinations.map((item,index)=><span key={item.slug}>{index>0?' · ':''}<a href={item.imageSource} target="_blank" rel="noreferrer">{item.name} — {item.imageCredit}</a> (<a href={item.imageLicenseUrl} target="_blank" rel="noreferrer">{item.imageLicense}</a>)</span>)}</p></section>
  <section className={styles.section}><div className={styles.head}><div><span className="eyebrow">Latest stories</span><h2>เรื่องใหม่จาก GepPao</h2><p>คู่มือ ไอเดียทริป ข่าว และเรื่องเล่าท้องถิ่น</p></div><Link href="/stories" className={styles.textLink}>ดูทั้งหมด →</Link></div><div className={styles.storyGrid}>{articles.length?articles.map((article,index)=><EditorialCard key={article.id} article={article} featured={index===0}/>):<div className={styles.emptyStories}><span className="eyebrow">Editorial desk</span><h3>กำลังเตรียมบทความชุดแรก</h3><p>ระบบบทความพร้อมใช้งานแล้ว เนื้อหาจะเผยแพร่เมื่อผ่านการตรวจข้อเท็จจริง แหล่งที่มา และสิทธิ์สื่อเท่านั้น ระหว่างนี้เริ่มสำรวจข้อมูลสถานที่และ Planner เขาใหญ่ได้เลย</p></div>}</div></section>
  <section className={styles.section}><div className={styles.head}><div><span className="eyebrow">Travel by mood</span><h2>เลือกจากสไตล์ที่อยากไป</h2></div></div><div className={styles.moods}>{['เที่ยววันเดียว','ครอบครัวมีเด็ก','พาสัตว์เลี้ยง','สายธรรมชาติ','คาเฟ่และของกิน','คู่รัก','งบจำกัด','Road trip'].map(mood=><Link key={mood} href={`/planner?q=${encodeURIComponent(mood)}`} className={styles.mood}>{mood} →</Link>)}</div></section>
  {!placeResult.error&&places.length>0&&<section className={styles.section}><div className={styles.head}><div><span className="eyebrow">Planner-ready local data</span><h2>ข้อมูลสถานที่สำหรับเริ่มวางแผน</h2><p>แสดงเฉพาะข้อมูลที่เผยแพร่และผ่านกฎ Public Data ของ GepPao</p></div><Link href="/search" className={styles.textLink}>สำรวจทั้งหมด →</Link></div><HomeCategoryCarousel places={places}/></section>}
  <section className={styles.funnel}><div className={styles.funnelInner}><div><span className="eyebrow">From story to trip</span><h2>เจอไอเดียที่ชอบแล้ว อย่าหยุดแค่การบันทึกโพสต์</h2><p>ส่งต่อ Destination และความสนใจเข้า Planner เพื่อสร้างทริป บันทึก แก้ไข และแชร์ได้ในที่เดียว</p></div><Link href="/planner" className="btn btn-primary">เริ่มวางแผนทริป</Link></div></section>
  <TravelTrustBand/><HostCTA/><p className={styles.footnote}>บทความเชิงพาณิชย์และลิงก์ Affiliate จะมีป้ายกำกับชัดเจน และไม่เปลี่ยนอันดับ Organic Recommendation ของ Planner</p>
 </main>
}
