import {parseStayQuery, stayQueryParams, stayRpcArgs, StayValidationError, type StayQuery} from '../stays/query';
export const SEARCH_TYPES = ['all','restaurant','cafe','accommodation','attraction','activity','event'] as const;
export type SearchType = typeof SEARCH_TYPES[number];
export type SearchQuery = StayQuery & {type: SearchType};
export function parseSearchQuery(params: URLSearchParams, today?: string): SearchQuery {
  const type = params.get('type') || 'all';
  if (params.getAll('type').length > 1 || !SEARCH_TYPES.includes(type as SearchType)) throw new StayValidationError('invalid');
  const query = parseStayQuery(params, today);
  // Price units are not comparable across restaurants, rooms and activities.
  if (type !== 'accommodation' && (query.capacityOnly || query.checkIn || query.checkOut || query.maxPrice !== null || query.sort !== 'name' || query.guests !== 2)) throw new StayValidationError('invalid');
  return {...query,type: type as SearchType};
}
export function searchQueryParams(query: SearchQuery) {
  const params = stayQueryParams(query); params.set('type',query.type);
  return params;
}
export function searchRpcArgs(query: SearchQuery) {return {...stayRpcArgs(query),p_type:query.type};}
export function legacyStaySearchHref(raw: Record<string,string|string[]|undefined>) {
  const allowed = new Set(['q','destination','guests','capacity','checkIn','checkOut','pet','parking','accessible','verified','maxPrice','sort','page','lang']);
  const params = new URLSearchParams({type:'accommodation'});
  for (const [key,value] of Object.entries(raw)) if (allowed.has(key)) for (const item of Array.isArray(value)?value:value?[value]:[]) params.append(key,item);
  return `/search?${params}`;
}
