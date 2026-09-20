import {Hero} from '@/components/home/Hero';
import {HostCTA} from '@/components/home/HostCTA';
import {HomeCategoryCarousel} from '@/components/home/HomeCategoryCarousel';
import {TravelTrustBand} from '@/components/home/TravelTrustBand';
import {createClient} from '@/lib/supabase/server';
import {mapPlace} from '@/lib/places';
import Link from 'next/link';
import styles from '@/components/home/HomeSections.module.css';
export const dynamic='force-dynamic';
export default async function Home(){const supabase=await createClient();const{data,error}=await supabase.from('places').select('*, place_images(id,image_url,alt_text,sort_order,is_cover), price_items(id,label,amount_min,amount_max,currency,price_unit,is_estimate)').eq('publication_status','published').order('name').limit(100);const places=(data??[]).map(mapPlace);return <main><Hero/>{!error&&<HomeCategoryCarousel places={places}/>}<TravelTrustBand/><section className={styles.wrap} id="featured-places"><div className={styles.notice}><div><h3>ยังไม่รู้จะเริ่มจากตรงไหน?</h3><p>บอกวันเดินทาง จำนวนคน งบ และสไตล์ที่ชอบ แล้วให้ Planner เริ่มร่างเส้นทางให้</p></div><Link href="/planner" className="btn btn-primary">เริ่มวางแผนทริป</Link></div></section><HostCTA/></main>}
