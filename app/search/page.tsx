import { SearchClient } from '@/components/search/SearchClient';
import { createClient } from '@/lib/supabase/server';

export default async function Search({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const q = await searchParams;
  const supabase = await createClient();
  const { data: listings } = await supabase.from('listings').select('*').eq('status', 'published');

  return (
    <main className="page">
      <div className="container section">
        <h1>ค้นหาที่พัก</h1>
        <p className="muted">กรองตามงบ โซน ประเภท และ vibe ที่ต้องการ</p>
        <SearchClient listings={listings || []} initialVibe={q.vibe} />
      </div>
    </main>
  );
}
