export const ADMIN_PAGE_SIZE=20;
export const publicationStatuses=['pending','draft','rejected','published','archived'] as const;
export const placeTypes=['accommodation','restaurant','cafe','attraction','activity'] as const;
export type AdminQuery={q:string;status:string;type:string;sort:'oldest'|'newest';page:number};
export function parseAdminQuery(raw:Record<string,string|string[]|undefined>):AdminQuery {
 const one=(key:string)=>typeof raw[key]==='string'?raw[key] as string:'';
 const status=one('status'),type=one('type'),page=one('page');
 return {q:one('q').trim().slice(0,100),status:status==='all'||publicationStatuses.some(x=>x===status)?status:'pending',type:placeTypes.some(x=>x===type)?type:'',sort:one('sort')==='newest'?'newest':'oldest',page:/^[1-9]\d{0,3}$/.test(page)?Math.min(Number(page),1000):1};
}
export function literalContains(value:string){return `%${value.replace(/[\\%_]/g,'\\$&')}%`;}
export function adminQueryHref(base:string,q:AdminQuery,overrides:Partial<AdminQuery>={},lang='th'){
 const next={...q,...overrides},params=new URLSearchParams({lang,status:next.status,sort:next.sort});
 if(next.q)params.set('q',next.q);if(next.type)params.set('type',next.type);if(next.page>1)params.set('page',String(next.page));
 return `${base}?${params}`;
}
export type AdminPlace={id:string;name:string;place_type:string;address:string|null;business_id:string|null;publication_status:string;verification_status:string;updated_at:string;businesses:{name:string}|{name:string}[]|null};
export type AdminMetric={id:string;count:number|null;error:boolean};
