import { Hero } from '@/components/home/Hero';
import { RegionListings } from '@/components/home/RegionListings';
import { HostCTA } from '@/components/home/HostCTA';
import { listings } from '@/data';

export default function Home(){return <main><Hero/><section className="section"><div className="container"><div className="section-head"><div><h2>ที่พักที่น่าสนใจ</h2><p className="muted">Premium Partner ได้รับ boost เมื่อเข้ากับความต้องการของคุณ</p></div><a href="/search" className="muted">ดูทั้งหมด →</a></div><RegionListings listings={listings}/></div></section><HostCTA/></main>}
