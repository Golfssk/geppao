import type {Metadata} from 'next';
import {createClient} from '@/lib/supabase/server';
import {parseStayQuery, bangkokToday, StayValidationError} from '@/lib/stays/query';
import {searchPublicStays} from '@/lib/stays/server';
import {StayDiscovery} from '@/components/stays/StayDiscovery';
import type {StayDestination, StayResult} from '@/lib/stays/types';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = {title: 'ค้นหาที่พัก · Find a stay', description: 'Explore published local stays with clear reference prices and verified facts. ค้นหาที่พักจากข้อมูลท้องถิ่นที่เผยแพร่แล้ว'};
export default async function Stays({searchParams}: {searchParams: Promise<Record<string, string | string[] | undefined>>}) {
  const raw = await searchParams, params = new URLSearchParams();
  for (const [key,value] of Object.entries(raw)) for (const item of Array.isArray(value) ? value : value ? [value] : []) params.append(key,item);
  const today = bangkokToday(); let error: string | null = null;
  let query = parseStayQuery(new URLSearchParams(), today);
  try {query = parseStayQuery(params,today);} catch (e) {error = e instanceof StayValidationError ? e.code : 'invalid';}
  let result: StayResult | null = null; let destinations: StayDestination[] = [];
  if (!error) {
    try {
      const supabase = await createClient();
      const [stays, destinationResult] = await Promise.all([searchPublicStays(query), supabase.from('destinations').select('slug,name').eq('status','active').order('name').limit(100).abortSignal(AbortSignal.timeout(8000))]);
      if (destinationResult.error) throw new Error('Destination catalog unavailable');
      result = stays; destinations = destinationResult.data ?? [];
    } catch {error = 'unavailable';}
  }
  return <StayDiscovery initialQuery={query} initialResult={result} initialError={error} destinations={destinations} today={today}/>;
}
