import { listings } from '@/data';
import { ListingCard } from '@/components/listing/ListingCard';
import { rankListings } from '@/lib/ranking/score';
export default async function Search({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){const q=await searchParams;const location=q.location;const vibe=q.vibe;const results=rankListings(listings,{location,vibes:vibe?[vibe]:[]});return <main className="page"><div className="container section"><h1>ค้นหาที่พัก</h1><p className="muted">ผลลัพธ์เรียงตามความเหมาะสมกับความต้องการ พร้อม Premium boost แบบมีเงื่อนไข</p><div className="grid" style={{marginTop:24}}>{results.map(l=><ListingCard key={l.id} listing={l}/>)}</div></div></main>}
