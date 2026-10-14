export const STAY_PAGE_SIZE = 12;
export type StayLocale = 'th' | 'en';
export type StayQuery = {
  q: string; destination: string; guests: number; capacityOnly: boolean;
  checkIn: string; checkOut: string; pet: boolean; parking: boolean;
  accessible: boolean; verified: boolean; maxPrice: number | null;
  sort: 'name' | 'price_asc' | 'price_desc'; page: number; locale: StayLocale;
};
export class StayValidationError extends Error {
  code: 'invalid' | 'dates' | 'past' | 'length';
  constructor(code: 'invalid' | 'dates' | 'past' | 'length') { super(code); this.code = code; }
}
export function bangkokToday(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit'}).format(now);
}
function validDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}
export function parseStayQuery(params: URLSearchParams, today = bangkokToday()): StayQuery {
  const get = (key: string) => {
    if (params.getAll(key).length > 1) throw new StayValidationError('invalid');
    return params.get(key) ?? '';
  };
  const integer = (key: string, fallback: number, min: number, max: number) => {
    const value = get(key); if (!value) return fallback;
    if (!/^\d+$/.test(value) || Number(value) < min || Number(value) > max) throw new StayValidationError('invalid');
    return Number(value);
  };
  const flag = (key: string) => { const value = get(key); if (value !== '' && value !== '1') throw new StayValidationError('invalid'); return value === '1'; };
  const q = get('q').trim().normalize('NFC'), destination = get('destination');
  if (q.length > 100) throw new StayValidationError('length');
  if (destination && !/^[a-z0-9-]{1,80}$/.test(destination)) throw new StayValidationError('invalid');
  const checkIn = get('checkIn'), checkOut = get('checkOut');
  if (checkIn || checkOut) {
    if (!validDate(checkIn) || !validDate(checkOut) || checkOut <= checkIn || (Date.parse(checkOut) - Date.parse(checkIn)) / 86400000 > 30) throw new StayValidationError('dates');
    if (checkIn < today) throw new StayValidationError('past');
  }
  const price = get('maxPrice');
  if (price && (!/^\d+(\.\d{1,2})?$/.test(price) || Number(price) > 1000000)) throw new StayValidationError('invalid');
  const sort = get('sort') || 'name';
  if (!['name', 'price_asc', 'price_desc'].includes(sort)) throw new StayValidationError('invalid');
  const locale = get('lang') || 'th';
  if (locale !== 'th' && locale !== 'en') throw new StayValidationError('invalid');
  return {q, destination, guests: integer('guests', 2, 1, 30), capacityOnly: flag('capacity'), checkIn, checkOut,
    pet: flag('pet'), parking: flag('parking'), accessible: flag('accessible'), verified: flag('verified'),
    maxPrice: price ? Number(price) : null, sort: sort as StayQuery['sort'], page: integer('page', 1, 1, 500), locale};
}
export function stayQueryParams(query: StayQuery) {
  const p = new URLSearchParams();
  if (query.q) p.set('q', query.q); if (query.destination) p.set('destination', query.destination);
  p.set('guests', String(query.guests)); p.set('lang', query.locale);
  if (query.checkIn) {p.set('checkIn', query.checkIn); p.set('checkOut', query.checkOut);}
  for (const [key, value] of [['capacity', query.capacityOnly], ['pet', query.pet], ['parking', query.parking], ['accessible', query.accessible], ['verified', query.verified]] as const) if (value) p.set(key, '1');
  if (query.maxPrice !== null) p.set('maxPrice', String(query.maxPrice));
  if (query.sort !== 'name') p.set('sort', query.sort); if (query.page > 1) p.set('page', String(query.page));
  return p;
}
export function stayRpcArgs(query: StayQuery) {
  return {p_query: query.q, p_destination: query.destination, p_guests: query.capacityOnly ? query.guests : null,
    p_pet: query.pet, p_parking: query.parking, p_accessible: query.accessible, p_verified: query.verified,
    p_max_price: query.maxPrice, p_sort: query.sort, p_page: query.page};
}
export function stayNights(query: Pick<StayQuery, 'checkIn' | 'checkOut'>) {
  return query.checkIn && query.checkOut ? (Date.parse(query.checkOut) - Date.parse(query.checkIn)) / 86400000 : null;
}
