import type {StayItem,StayResult} from '../stays/types';
import type {StayQuery} from '../stays/query';
// Mirrors the production page boundary; asserted against it in the demo tests.
const STAY_PAGE_SIZE=12;
// Synthetic UX fixtures only. Never imported by the production stay repository.
export const demoDestinations=[{slug:'demo-north',name:'DEMO · โซนเหนือ / North'},{slug:'demo-south',name:'DEMO · โซนใต้ / South'}];
export const demoStays: (StayItem & {destination_slug:string})[]=Array.from({length:18},(_,index)=>{
 const n=index+1;
 return {id:`demo-stay-${n}`,slug:`demo-stay-${n}`,name:`DEMO ${String(n).padStart(2,'0')} · ${['Garden','Forest','Valley'][index%3]} Stay`,
  description:'ข้อมูลจำลองสำหรับลอง UX เท่านั้น ไม่ใช่ที่พักจริง · Synthetic UX fixture, not a real property.',
  address:'DEMO · พื้นที่ตัวอย่าง / Sample area',destination_name:demoDestinations[index%2].name,destination_slug:demoDestinations[index%2].slug,
  verification_status:index%2===0?'verified':'unverified',last_verified_at:null,
  pet_friendly:index%3===0?true:index%3===1?false:null,parking_available:index%2===0?true:null,
  accessibility_supported:index%4===0?true:null,maximum_guests:index%4===0?null:2+(index%3)*2,
  check_in_time:'14:00:00',check_out_time:'11:00:00',image_url:null,image_alt:null,
  price:index===17?null:800+index*150,price_max:index===17?null:1000+index*150,is_estimate:true};
});
export function demoEnabled(vercelEnv:string|undefined,nodeEnv:string|undefined) {
 return vercelEnv==='preview'||nodeEnv==='development';
}
export function searchDemoStays(q:StayQuery):StayResult {
 const needle=q.q.toLocaleLowerCase();
 const rows=demoStays.filter(x=>(!needle||`${x.name} ${x.address} ${x.destination_name}`.toLocaleLowerCase().includes(needle))
  &&(!q.destination||x.destination_slug===q.destination)
  &&(!q.pet||x.pet_friendly===true)&&(!q.parking||x.parking_available===true)
  &&(!q.accessible||x.accessibility_supported===true)&&(!q.verified||x.verification_status==='verified')
  &&(!q.capacityOnly||(x.maximum_guests!==null&&x.maximum_guests>=q.guests))
  &&(q.maxPrice===null||(x.price!==null&&x.price<=q.maxPrice)));
 rows.sort((a,b)=>{
  if(q.sort!=='name'){
   if(a.price===null&&b.price!==null)return 1;if(b.price===null&&a.price!==null)return -1;
   if(a.price!==null&&b.price!==null&&a.price!==b.price)return q.sort==='price_asc'?a.price-b.price:b.price-a.price;
  }
  return a.name.localeCompare(b.name)||a.id.localeCompare(b.id);
 });
 return {items:rows.slice((q.page-1)*STAY_PAGE_SIZE,q.page*STAY_PAGE_SIZE),total:rows.length,page:q.page,pageSize:STAY_PAGE_SIZE};
}
