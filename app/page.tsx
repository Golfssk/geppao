import { Hero } from '@/components/home/Hero';
import { HostCTA } from '@/components/home/HostCTA';
import { ListingCard } from '@/components/listing/ListingCard';
import { createClient } from '@/lib/supabase/server';
import { mapListing } from '@/lib/listings';

export default async function Home() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('listings')
    .select('*')
    .eq('status', 'published');

  const listings = data?.map(mapListing) ?? [];

  return (
    <main>
      <Hero />
      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <h2>ที่พักที่น่าสนใจ</h2>
              <p className="muted">ค้นหาที่พักที่เข้ากับสไตล์และความต้องการของคุณ</p>
            </div>
            <a href="/search" className="muted">ดูทั้งหมด →</a>
          </div>
          <div className="grid">
            {!error && listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </div>
      </section>
      <HostCTA />
    </main>
  );
}
