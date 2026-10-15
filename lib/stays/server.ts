import 'server-only';
import {createClient} from '@/lib/supabase/server';
import {managedPublicMediaUrl} from '@/lib/public-media';
import {stayRpcArgs, STAY_PAGE_SIZE, type StayQuery} from './query';
import type {StayItem, StayResult} from './types';
// Uses the session's anon/authenticated key, never a service-role client.
export async function searchPublicStays(query: StayQuery): Promise<StayResult> {
  const supabase = await createClient();
  const {data, error} = await supabase.rpc('search_public_stays', stayRpcArgs(query)).abortSignal(AbortSignal.timeout(8000));
  if (error || !data || !Array.isArray(data.items) || !Number.isSafeInteger(data.total) || data.total < 0) throw new Error('Stay catalog unavailable');
  const items = (data.items as StayItem[]).map(item => ({...item, image_url: managedPublicMediaUrl(item.image_url)}));
  return {items, total: data.total, page: query.page, pageSize: STAY_PAGE_SIZE};
}
