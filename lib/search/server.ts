import 'server-only';
import {createClient} from '@/lib/supabase/server';
import {managedPublicMediaUrl} from '@/lib/public-media';
import {STAY_PAGE_SIZE} from '@/lib/stays/query';
import {searchRpcArgs, type SearchQuery} from './query';
import type {SearchItem,SearchResult} from './types';
// Session anon/authenticated client only. Never use a service-role search client.
export async function searchPublicCatalog(query:SearchQuery):Promise<SearchResult> {
  const supabase=await createClient();
  const {data,error}=await supabase.rpc('search_public_catalog',searchRpcArgs(query)).abortSignal(AbortSignal.timeout(8000));
  if(error||!data||!Array.isArray(data.items)||!Number.isSafeInteger(data.total)||data.total<0) throw new Error('Public catalog unavailable');
  const items=(data.items as SearchItem[]).map(item=>({...item,image_url:managedPublicMediaUrl(item.image_url)}));
  return {items,total:data.total,page:query.page,pageSize:STAY_PAGE_SIZE};
}
