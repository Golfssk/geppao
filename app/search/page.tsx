import type {Metadata} from 'next';
import {createClient} from '@/lib/supabase/server';
import {bangkokToday,StayValidationError} from '@/lib/stays/query';
import {parseSearchQuery} from '@/lib/search/query';
import {searchPublicCatalog} from '@/lib/search/server';
import type {SearchResult} from '@/lib/search/types';
import {UnifiedSearchClient} from '@/components/search/UnifiedSearchClient';
import type {StayDestination} from '@/lib/stays/types';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'ค้นหาทั้งทริปในที่เดียว',description:'ค้นหาร้านอาหาร คาเฟ่ ที่พัก ที่เที่ยว กิจกรรม และอีเวนต์ในที่เดียว เลือกประเภทและวางแผนทริปต่อได้'};
export default async function Search({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}) {
  const params=new URLSearchParams();
  for(const[key,value]of Object.entries(await searchParams)) for(const v of Array.isArray(value)?value:value?[value]:[]) params.append(key,v);
  const today=bangkokToday();let query=parseSearchQuery(new URLSearchParams(),today),error:string|null=null,result:SearchResult|null=null;
  let destinations:StayDestination[]=[];
  try{query=parseSearchQuery(params,today);}catch(e){error=e instanceof StayValidationError?e.code:'invalid';}
  if(!error)try{
    const supabase=await createClient();
    const [catalog,destinationResult]=await Promise.all([searchPublicCatalog(query),supabase.from('destinations').select('slug,name').eq('status','active').order('name').limit(100).abortSignal(AbortSignal.timeout(8000))]);
    if(destinationResult.error)throw new Error('Destination catalog unavailable');
    result=catalog;destinations=destinationResult.data??[];
  }catch{error='unavailable';}
  return <UnifiedSearchClient initialQuery={query} initialResult={result} initialError={error} destinations={destinations} today={today}/>;
}
