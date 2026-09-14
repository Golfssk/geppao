import type { Listing } from '@/types/listing';
import { rankListings } from '@/lib/ranking/score';
export type TripPlan={summary:{destination:string;guests?:number;budgetPerPerson?:number;vibe:string[]};recommendedStay:{listingId:string;matchScore:number;reason:string};itinerary:{day:number;time:string;place:string;activity:string}[]};
export function prepareAgentContext(listings:Listing[],prefs:{vibes?:string[];location?:string;guests?:number;budget?:number}){return rankListings(listings,prefs).slice(0,10);}
