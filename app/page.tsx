import {Hero} from '@/components/home/Hero';
import {HostCTA} from '@/components/home/HostCTA';
import {ListingCard} from '@/components/listing/ListingCard';
import {createClient} from '@/lib/supabase/server';
import {mapListing} from '@/lib/listings';
import Link from 'next/link';
import styles from '@/components/home/HomeSections.module.css';
export default async function Home(){const supabase=await createClient();const{data,error}=await supabase.from('listings').select('*').eq('status','published');const listings=data?.map(mapListing)??[];return <main><Hero/><section className={styles.wrap} id="featured-places"><div className={styles.sectionHead}><div><p className={styles.eyebrow}>Local highlights</p><h2 className={styles.heading}>เลือกจุดแวะที่ทำให้ทริปน่าจดจำ</h2><p className={styles.description}>คัดสรรที่พักและมุมพักผ่อนสำหรับเริ่มต้นทริปของคุณ</p></div><Link href="/search" className={styles.link}>ดูทั้งหมด →</Link></div><div className={styles.grid}>{!error&&listings.slice(0,6).map(listing=><ListingCard key={listing.id} listing={listing}/>)}</div><div className={styles.notice}><div><h3>ยังไม่รู้จะเริ่มจากตรงไหน?</h3><p>บอกวันเดินทาง จำนวนคน งบ และสไตล์ที่ชอบ แล้วให้ Planner เริ่มร่างเส้นทางให้</p></div><Link href="/planner" className="btn btn-primary">เริ่มวางแผนทริป</Link></div></section><HostCTA/></main>}
