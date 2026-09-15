import { SearchClient } from '@/components/search/SearchClient';
import { createClient } from '@/lib/supabase/server';
import { mapListing } from '@/lib/listings';

export default async function Search({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const q = await searchParams;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('status', 'published');

  const listings = data?.map(mapListing) ?? [];

  return (
    <main className="page">
      <div className="container section">
        <h1>ค้นหาที่พัก</h1>
        <p className="muted">กรองตามงบ โซน ประเภท และ vibe ที่ต้องการ</p>
        <SearchClient listings={error ? [] : listings} initialVibe={q.vibe} />
      </div>
    </main>
  );
}
