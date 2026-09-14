import { Hero } from '@/components/home/Hero';
import { ListingCard } from '@/components/listing/ListingCard';
import { HostCTA } from '@/components/home/HostCTA';
import { listings } from '@/data';
export default function Home(){return <main><Hero/><section className="section"><div className="container"><div className="planner-band"><div><h3>ไม่รู้จะเริ่มตรงไหน? บอก AI มาเลย</h3><p>เล่าจำนวนคน งบ และ vibe ของทริป แล้วให้ GepPao ช่วยคัดที่พักกับจุดแฮงเอ้าท์ให้</p></div><a className="btn btn-sage" href="/planner">ลองวางแผนทริป</a></div></div></section><section className="section"><div className="container"><div className="section-head"><div><h2>ที่พักที่น่าสนใจ</h2><p className="muted">Premium Partner ได้รับ boost เมื่อเข้ากับความต้องการของคุณ</p></div><a href="/search" className="muted">ดูทั้งหมด →</a></div><div className="grid">{listings.map(l=><ListingCard key={l.id} listing={l}/>)}</div></div></section><HostCTA/></main>}
