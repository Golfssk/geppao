import type {SearchType} from './query';
export type SearchItem = {
  id:string; kind:'place'|'event'; type:Exclude<SearchType,'all'>; slug:string; name:string;
  description:string|null; address:string|null; destination_name:string|null;
  image_url:string|null; image_alt:string|null; verification_status:string;
  price:number|null; price_unit:string|null; currency:string|null; is_estimate:boolean|null;
  starts_at:string|null;
};
export type SearchResult = {items:SearchItem[];total:number;page:number;pageSize:number};
