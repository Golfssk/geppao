import { listings } from '@/data';
import { SearchClient } from '@/components/search/SearchClient';

export default async function Search({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}){const q=await searchParams;return <main className="page"><div className="container section"><h1>ค้นหาที่พัก</h1><p className="muted">กรองตามงบ โซน ประเภท และ vibe ที่ต้องการ</p><SearchClient listings={listings} initialVibe={q.vibe}/></div></main>}
