import type { Listing } from '@/types/listing';
export type RankingContext={vibes?:string[];location?:string;guests?:number;budget?:number};
const overlap=(a:string[]=[],b:string[]=[])=>{if(!a.length||!b.length)return 0;const A=a.map(x=>x.toLowerCase());return b.filter(x=>A.includes(x.toLowerCase())).length/b.length};
export function scoreListing(l:Listing,c:RankingContext){const vibe=overlap(l.vibe,c.vibes||[]);const location=c.location&&l.location.toLowerCase().includes(c.location.toLowerCase())?1:0;const capacity=c.guests?(l.capacity>=c.guests?1:Math.max(0,1-(c.guests-l.capacity)/Math.max(c.guests,1))):.5;const value=c.budget?(l.price<=c.budget?1:Math.max(0,1-(l.price-c.budget)/Math.max(c.budget,1))):.5;const premium=l.tier==='premium'?0.1:0;return vibe*.4+capacity*.25+location*.15+value*.1+premium;}
export function rankListings(listings:Listing[],ctx:RankingContext){return [...listings].map(l=>({...l,score:scoreListing(l,ctx)})).sort((a,b)=>b.score-a.score);}
