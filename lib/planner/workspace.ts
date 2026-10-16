type CostItem={estimated_cost:number|string|null};
export function costCoverage(items:CostItem[]){
 const known=items.filter(i=>i.estimated_cost!==null&&i.estimated_cost!==undefined&&Number.isFinite(Number(i.estimated_cost))&&Number(i.estimated_cost)>=0);
 return {total:known.reduce((sum,i)=>sum+Number(i.estimated_cost),0),known:known.length,missing:items.length-known.length,count:items.length};
}
export function routePoints(items:any[]){
 const coordinates=items.map((item,index)=>{const p=item.places||item.events;return {id:item.id,name:p?.name||'สถานที่',number:index+1,lat:p?.latitude,lng:p?.longitude}}).filter(p=>typeof p.lat==='number'&&typeof p.lng==='number'&&Number.isFinite(p.lat)&&Number.isFinite(p.lng)&&Math.abs(p.lat)<=85&&Math.abs(p.lng)<=180);
 if(!coordinates.length)return [];
 const project=(lat:number)=>Math.log(Math.tan(Math.PI/4+lat*Math.PI/360));
 const xs=coordinates.map(p=>p.lng*Math.PI/180),ys=coordinates.map(p=>project(p.lat));
 const minX=Math.min(...xs),maxY=Math.max(...ys),span=Math.max(Math.max(...xs)-minX,maxY-Math.min(...ys),0.001);
 const width=(Math.max(...xs)-minX)/span*300,height=(maxY-Math.min(...ys))/span*300;
 return coordinates.map((p,i)=>({...p,x:50+(300-width)/2+(xs[i]-minX)/span*300,y:50+(300-height)/2+(maxY-ys[i])/span*300}));
}
// Never forward arbitrary trip preferences, owner identifiers, private notes or future wallet fields.
export function publicTripPayload(data:any){
 if(!data?.trip)return null;const t=data.trip;
 return {trip:{title:t.title,start_date:t.start_date,end_date:t.end_date,travelers:t.travelers,currency:t.currency},days:(Array.isArray(data.days)?data.days:[]).map((d:any)=>({id:d.id,dayNumber:d.dayNumber,serviceDate:d.serviceDate,title:d.title,items:(Array.isArray(d.items)?d.items:[]).map((i:any)=>({id:i.id,position:i.position,startsAt:i.startsAt,endsAt:i.endsAt,estimatedCost:i.estimatedCost,currency:i.currency,place:i.place?{name:i.place.name,slug:i.place.slug}:null,event:i.event?{name:i.event.name,slug:i.event.slug}:null}))}))};
}

export function offlineTripHtml(trip:any){
 const escape=(value:unknown)=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
 const time=(value:unknown)=>typeof value==='string'&&Number.isFinite(Date.parse(value))?new Intl.DateTimeFormat('th-TH',{timeZone:'Asia/Bangkok',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(value)):'ยังไม่ระบุ';
 const days=(trip.trip_days??[]).map((day:any)=>`<section><h2>วันที่ ${escape(day.day_number)} · ${escape(day.service_date)}</h2><ol>${[...(day.trip_items??[])].sort((a:any,b:any)=>a.position-b.position).map((i:any)=>{const p=i.places||i.events;return `<li><strong>${escape(p?.name||'ข้อมูลไม่พร้อม')}</strong><p>${escape(p?.address||'ยังไม่มีที่อยู่')}</p><p>เวลาไทย ${escape(time(i.starts_at))} – ${escape(time(i.ends_at))}</p><p>${i.estimated_cost==null?'ยังไม่ทราบราคา':escape(i.estimated_cost)+' '+escape(i.currency)}</p></li>`}).join('')}</ol></section>`).join('');
 return `<!doctype html><html lang="th"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src 'none'"><title>${escape(trip.title)} — Geppao</title><style>body{font:16px/1.6 system-ui,sans-serif;color:#123e2b;max-width:760px;margin:32px auto;padding:0 24px;overflow-wrap:anywhere}section{border-top:1px solid #cbd9c7;margin:24px 0}li{padding:12px 0}p{margin:8px 0}</style><h1>${escape(trip.title)}</h1><p>${escape(trip.start_date)} – ${escape(trip.end_date)}</p><p>สำเนาแผนสำหรับอ่านออฟไลน์ ไม่อัปเดตตามทริปจริง ไม่มีโน้ตส่วนตัว เอกสารจอง หรือข้อมูลจราจร</p>${days}</html>`;
}
