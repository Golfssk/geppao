export type LinkKind='google_maps'|'agoda'|'traveloka'|'facebook'|'booking'|'website';
export const LINK_LABELS:Record<LinkKind,string>={google_maps:'Google Maps',agoda:'Agoda',traveloka:'Traveloka',facebook:'Facebook',booking:'Booking.com',website:'เว็บไซต์กิจการ'};
const isDomain=(host:string,domain:string)=>host===domain||host.endsWith('.'+domain);
export function cleanSourceUrl(input:unknown):URL{
 if(typeof input!=='string'||input.length>2000)throw new Error('กรุณาวางลิงก์ https ที่ยาวไม่เกิน 2,000 ตัวอักษร');
 let url:URL;try{url=new URL(input.trim())}catch{throw new Error('ลิงก์ไม่ถูกต้อง กรุณาคัดลอกลิงก์เต็มอีกครั้ง')}
 if(url.protocol!=='https:'||url.username||url.password||(url.port&&url.port!=='443')||!url.hostname.includes('.')||url.hostname.endsWith('.')||url.hostname==='localhost'||/\.(?:local|internal|localhost)$/i.test(url.hostname)||/^[\d.:\[\]]+$/.test(url.hostname))throw new Error('ใช้ลิงก์ https ของเว็บไซต์สาธารณะที่ไม่มีข้อมูลเข้าสู่ระบบ');
 url.hash='';for(const key of [...url.searchParams.keys()])if(/^(utm_|gclid|fbclid|token|key|password|auth|session|access_token|signature|sig|x-amz-)/i.test(key))url.searchParams.delete(key);
 return url;
}
export function linkKind(url:URL):LinkKind{
 const h=url.hostname.toLowerCase();
 if(h==='maps.app.goo.gl'||h==='goo.gl'&&url.pathname.startsWith('/maps')||(['google.com','google.co.th'].some(d=>isDomain(h,d))&&(url.pathname.startsWith('/maps')||h.startsWith('maps.'))))return'google_maps';
 if(isDomain(h,'agoda.com'))return'agoda';if(isDomain(h,'traveloka.com'))return'traveloka';if(isDomain(h,'facebook.com')||h==='fb.com'||h==='fb.watch')return'facebook';if(isDomain(h,'booking.com'))return'booking';return'website';
}
export function restrictedAsset(url:URL){return linkKind(url)!=='website'||['googleusercontent.com','ggpht.com','gstatic.com','google.com','google.co.th','agoda.net','agoda.com','trvl-media.com','bstatic.com','traveloka.com','tvlk.com','fbcdn.net','cdninstagram.com','airbnb.com','airbnb.co.th','muscache.com','expedia.com','tripadvisor.com','trip.com'].some(d=>isDomain(url.hostname,d));}
export function mapIdentity(url:URL){if(linkKind(url)!=='google_maps')return null;const q=url.searchParams.get('query_place_id')||url.searchParams.get('place_id');const text=decodeURIComponent(url.pathname);return q||text.match(/!1s([^!/?]+)/)?.[1]||null;}
export function mapHints(url:URL){if(linkKind(url)!=='google_maps')return{};const part=url.pathname.match(/\/place\/([^/]+)/)?.[1];let name='';try{name=part?decodeURIComponent(part).replace(/\+/g,' '):''}catch{}return{name:name.slice(0,120),googleMapsUrl:url.toString()};}
export function normalizeName(s:string){return s.normalize('NFKC').toLowerCase().replace(/[^a-z0-9ก-๙]/g,'');}
export type ExistingPlace={id:string;slug:string;name:string;place_type:string;address:string|null;latitude:number|null;longitude:number|null;google_maps_url:string|null;business_id:string|null};
export type PlaceMatch={id:string;name:string;slug:string;owned:boolean;reason:'source'|'name'};
// RLS limits the lookup to published records and the current business's own records.
export async function findPlaceMatches(db:any,url:URL,name:string,businessId:string):Promise<PlaceMatch[]>{
 const columns='id,slug,name,place_type,address,latitude,longitude,google_maps_url,business_id';
 const candidates:ExistingPlace[]=[];
 const{data:sources,error:sourceError}=await db.from('place_import_sources').select('place_id').eq('source_url',url.toString()).limit(5);if(sourceError)throw new Error('ตรวจรายการเดิมไม่สำเร็จ กรุณาลองใหม่');
 if(sources?.length){const{data,error}=await db.from('places').select(columns).in('id',sources.map((s:any)=>s.place_id));if(error)throw new Error('ตรวจรายการเดิมไม่สำเร็จ');candidates.push(...(data??[]));}
 const identity=mapIdentity(url);
 if(identity||linkKind(url)==='google_maps'){
  const query=db.from('places').select(columns);
  const{data,error}=identity?await query.ilike('google_maps_url','%'+identity.replace(/[\\%_]/g,'\\$&')+'%').limit(8):await query.eq('google_maps_url',url.toString()).limit(8);
  if(error)throw new Error('ตรวจรายการเดิมไม่สำเร็จ');candidates.push(...(data??[]));
 }
 if(name.trim().length>=3){const{data,error}=await db.from('places').select(columns).ilike('name',name.trim().replace(/[\\%_]/g,'\\$&')).limit(5);if(error)throw new Error('ตรวจรายการเดิมไม่สำเร็จ');candidates.push(...(data??[]));}
 return [...new Map(candidates.map(p=>[p.id,{id:p.id,name:p.name,slug:p.slug,owned:p.business_id===businessId,reason:(sources?.some((s:any)=>s.place_id===p.id)||(identity&&p.google_maps_url?.includes(identity))||p.google_maps_url===url.toString()?'source':'name')as 'source'|'name'}])).values()].slice(0,5);
}
