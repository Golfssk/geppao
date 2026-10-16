import {cleanSourceUrl,restrictedAsset} from './links';
export type ImportFields={name?:string;address?:string;description?:string;phone?:string;latitude?:string;longitude?:string;googleMapsUrl?:string;websiteUrl?:string;type?:string};
const text=(v:unknown,max=2000)=>typeof v==='string'?v.replace(/<[^>]*>/g,'').trim().slice(0,max):'';
function decode(s:string){return s.replace(/&(?:amp|quot|apos|lt|gt|#39|#\d+|#x[0-9a-f]+);/gi,v=>{const named:Record<string,string>={'&amp;':'&','&quot;':'"','&apos;':"'",'&#39;':"'",'&lt;':'<','&gt;':'>'};if(named[v.toLowerCase()])return named[v.toLowerCase()];const n=v[2]?.toLowerCase()==='x'?parseInt(v.slice(3,-1),16):Number(v.slice(2,-1));return n>0&&n<=0x10ffff?String.fromCodePoint(n):''});}
const value=(s:string)=>text(decode(s));
function attrs(tag:string){return Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)].map(m=>[m[1].toLowerCase(),decode(m[2]??m[3]??m[4]??'')]));}
function businessType(v:unknown){const names=Array.isArray(v)?v:[v];for(const t of names){if(['Hotel','Resort','LodgingBusiness','BedAndBreakfast','VacationRental','Campground','Hostel','Motel'].includes(String(t)))return'accommodation';if(['CafeOrCoffeeShop','Bakery'].includes(String(t)))return'cafe';if(t==='Restaurant')return'restaurant';if(['TouristAttraction','Park','Museum'].includes(String(t)))return'attraction';if(['LocalBusiness','FoodEstablishment'].includes(String(t)))return'';}return null;}
export function extractOwnerMetadata(html:string,source:string){
 const metas:Record<string,string>={};for(const m of html.matchAll(/<meta\b[^>]{0,4000}>/gi)){const a=attrs(m[0]),key=(a.property||a.name||'').toLowerCase();if(key&&a.content&&!metas[key])metas[key]=a.content;}
 const nodes:any[]=[];function walk(v:any,depth=0){if(depth>8||nodes.length>200||!v||typeof v!=='object')return;if(Array.isArray(v)){for(const x of v)walk(x,depth+1);return;}if(businessType(v['@type'])!==null)nodes.push(v);if(v['@graph'])walk(v['@graph'],depth+1);if(v.mainEntity)walk(v.mainEntity,depth+1);}
 for(const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi))if(attrs(m[1]).type?.toLowerCase()==='application/ld+json')try{walk(JSON.parse(m[2]))}catch{}
 const unique=[...new Map(nodes.map(n=>[String(n['@id']||n.name||JSON.stringify(n)),n])).values()];const one=unique.length===1?unique[0]:null;
 const fields:ImportFields={websiteUrl:source};
 // A page describing several businesses is ambiguous; do not pick the first listing.
 if(unique.length>1)return{fields,images:[] as string[],ambiguous:true};
 fields.name=text(one?.name||metas['og:title']||value(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]||''),120);
 fields.description=value(one?.description||metas['og:description']||metas.description||'').slice(0,2000);
 if(one){const a=one.address;fields.address=typeof a==='string'?text(a,500):a&&typeof a==='object'?[a.streetAddress,a.addressLocality,a.addressRegion,a.postalCode,a.addressCountry].filter(v=>typeof v==='string').join(' ').slice(0,500):'';fields.phone=text(one.telephone,30);const lat=one.geo?.latitude,lon=one.geo?.longitude;if(lat!=null&&lon!=null&&Number.isFinite(Number(lat))&&Number.isFinite(Number(lon))&&Math.abs(Number(lat))<=90&&Math.abs(Number(lon))<=180){fields.latitude=String(lat);fields.longitude=String(lon)}const type=businessType(one['@type']);if(type)fields.type=type;}
 const raw=one?.image;const imageValues=[...(Array.isArray(raw)?raw:[raw]),metas['og:image'],metas['twitter:image']].map(v=>typeof v==='string'?v:typeof v?.url==='string'?v.url:typeof v?.contentUrl==='string'?v.contentUrl:'');const images:string[]=[];
 for(const v of imageValues){if(!v)continue;try{const u=cleanSourceUrl(new URL(v,source).toString());if(!restrictedAsset(u)&&!images.includes(u.toString()))images.push(u.toString())}catch{}}
 return{fields:Object.fromEntries(Object.entries(fields).filter(([,v])=>Boolean(v))) as ImportFields,images:images.slice(0,3),ambiguous:false};
}
