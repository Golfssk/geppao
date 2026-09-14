import { Hero } from '@/components/home/Hero';
import { HostCTA } from '@/components/home/HostCTA';
import { ListingCard } from '@/components/listing/ListingCard';
import { createClient } from '@/lib/supabase/server';

export default async function Home() {
  const supabase = await createClient();
  const { data: listings } = await supabase.from('listings').select('*').eq('status', 'published');

  return (
    <main>
      <Hero />
      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <h2>ที่พักที่น่าสนใจ</h2>
              <p className="muted">Premium Partner ได้รับ boost เมื่อเข้ากับความต้องการของคุณ</p>
            </div>
            <a href="/search" className="muted">ดูทั้งหมด →</a>
          </div>
          <div className="grid">
            {listings?.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        </div>
      </section>
      <HostCTA />
    </main>
  );
}
