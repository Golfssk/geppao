import provinces from './provinces.json' with {type:'json'};
import geography from './thailand-shapes.json' with {type:'json'};
export const regions=[{id:'all',th:'ทั้งประเทศ',en:'All Thailand'},{id:'north',th:'เหนือ',en:'North'},{id:'northeast',th:'ตะวันออกเฉียงเหนือ',en:'Northeast'},{id:'central',th:'กลาง',en:'Central'},{id:'east',th:'ตะวันออก',en:'East'},{id:'west',th:'ตะวันตก',en:'West'},{id:'south',th:'ใต้',en:'South'}] as const;
export type Region=typeof regions[number]['id'];
export type Province=typeof provinces[number];
export const provinceData=provinces;
export const provinceShapes=geography.provinces;
export const featuredProvinceIds=['nakhon-ratchasima','nakhon-nayok','kanchanaburi'];
export const guideSlugs:Record<string,string>={'nakhon-ratchasima':'pak-chong-khao-yai','nakhon-nayok':'nakhon-nayok','kanchanaburi':'kanchanaburi','chon-buri':'pattaya'};
export function filterProvinces(region:Region='all',query=''){
 const text=query.trim().toLocaleLowerCase();
 return provinces.filter(p=>(region==='all'||p.region===region)&&(!text||[p.name,p.nameEn,p.landmark,p.landmarkEn].some(t=>t.toLocaleLowerCase().includes(text))));
}
/** Province markers represent an interior point of each province, NOT a landmark coordinate. */
export function regionViewBox(region:Region):string{
 if(region==='all')return '0 0 500 820';
 const ids=new Set(filterProvinces(region).map(p=>p.id)),shapes=provinceShapes.filter(s=>ids.has(s.id));
 const x=Math.min(...shapes.map(s=>s.bounds[0]))-24,y=Math.min(...shapes.map(s=>s.bounds[1]))-24;
 const w=Math.max(...shapes.map(s=>s.bounds[2]))-x+24,h=Math.max(...shapes.map(s=>s.bounds[3]))-y+24;
 return [x,y,w,h].map(n=>n.toFixed(2)).join(' ');
}
export function provinceSearchHref(p:Province,locale:'th'|'en'){
 // Text search is supported for every province; never invent database destination IDs.
 return `/search?${new URLSearchParams({q:p.name,type:'all',lang:locale})}`;
}
