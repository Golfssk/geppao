import type { Listing } from '@/types/listing';
import { ListingCard } from '@/components/listing/ListingCard';

export function RegionListings({listings}:{listings:(Listing & {score?:number})[]}){
  const regions=Array.from(new Set(listings.map(l=>l.region)));
  return <>{regions.map(region=>
    <div className="region-row" key={region}>
      <div className="region-head"><h3>{region}</h3><span className="region-arrow">→</span></div>
      <div className="region-scroll">
        {listings.filter(l=>l.region===region).map(l=>
          <div className="region-card" key={l.id}><ListingCard listing={l}/></div>
        )}
      </div>
    </div>
  )}</>;
}
