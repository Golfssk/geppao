import type {AdminPlace,AdminQuery} from './query';
// Mirrors the server queue page size; regression test asserts the same 20-row boundary.
const ADMIN_PAGE_SIZE=20;
// Fictional records only. No customer, host, contact, address or production data.
export const adminDemoPlaces:AdminPlace[]=Array.from({length:28},(_,i)=>({
 id:`demo-admin-${i+1}`,name:`DEMO ${String(i+1).padStart(2,'0')} · ${['Garden Stay','Forest Café','Valley Walk'][i%3]}`,
 place_type:['accommodation','cafe','attraction'][i%3],address:'DEMO · พื้นที่สมมติ / Fictional area',business_id:i%3===1?'demo-business':null,
 businesses:i%3===1?{name:'DEMO · Sample business'}:null,publication_status:i<22?'pending':i<24?'draft':i<26?'published':'rejected',
 verification_status:i%4===0?'verified':'unverified',updated_at:new Date(Date.UTC(2026,8,1+i,8)).toISOString()
}));
export function searchAdminDemo(query:AdminQuery){
 const all=adminDemoPlaces.filter(p=>(query.status==='all'||p.publication_status===query.status)&&(!query.type||p.place_type===query.type)&&(!query.q||p.name.toLowerCase().includes(query.q.toLowerCase()))).sort((a,b)=>(query.sort==='oldest'?1:-1)*a.updated_at.localeCompare(b.updated_at));
 return{places:all.slice((query.page-1)*ADMIN_PAGE_SIZE,query.page*ADMIN_PAGE_SIZE),total:all.length};
}
