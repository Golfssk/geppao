import {NextResponse} from 'next/server';
import {createClient} from '@/lib/supabase/server';

type PriceStatus = 'missing' | 'estimated' | 'confirmed';
type Price = {cost:number|null; status:PriceStatus; unit:string|null};
type Coord = {latitude:number; longitude:number};

const number=(value:string, pattern:RegExp)=>{const m=value.match(pattern);return m?Number(m[1].replace(/,/g,'')):undefined;};
const hasText=(value:unknown)=>typeof value==='string'&&value.trim().length>0;
const hasCoordinate=(value:unknown)=>Number.isFinite(Number(value));

function parseRequest(text:string,startDate?:string,endDate?:string){
  const travelers=number(text,/(?:ไป|กับ|สำหรับ|ทั้งหมด)?\s*(\d+)\s*(?:คน|ท่าน)/i)||2;
  const budgetPerPerson=number(text,/(?:งบ|budget)[^\d]*(\d[\d,]*)\s*(?:บาท)?\s*(?:\/|ต่อ)\s*(?:คน|ท่าน)/i)
    ?? number(text,/(\d[\d,]*)\s*บาท\s*\/\s*คน/i);
  const budgetTotal=number(text,/(?:งบ|budget)[^\d]*(\d[\d,]*)\s*(?:บาท)?/i);
  const nights=number(text,/(\d+)\s*(?:คืน|night|nights)/i) ?? (startDate&&endDate ? Math.max(1,Math.round((new Date(endDate).getTime()-new Date(startDate).getTime())/86400000)) : 1);
  const pet=/หมา|สุนัข|แมว|สัตว์เลี้ยง|pet/i.test(text);
  const family=/ครอบครัว|เด็ก|family|ลูก/i.test(text);
  const vibeKeywords=['ธรรมชาติ','คาเฟ่','กาแฟ','กิน','อาหาร','ร้านอาหาร','ปาร์ตี้','party','ชิล','พักผ่อน','ถ่ายรูป','กิจกรรม','adventure','ธรรมชาติ'];
  const wants=vibeKeywords.filter(k=>text.toLowerCase().includes(k.toLowerCase()));
  return {travelers,budgetPerPerson,budgetTotal:budgetPerPerson?budgetPerPerson*travelers:budgetTotal,nights,pet,family,wants,startDate,endDate};
}

function priceOf(items:any[]):Price{
  const p=items?.[0];
  if(!p||p.amount_min==null)return {cost:null,status:'missing',unit:null};
  return {cost:Number(p.amount_min),status:p.is_estimate?'estimated':'confirmed',unit:p.price_unit||null};
}
function estimateCost(price:Price, travelers:number,nights:number,type:string){
  if(price.cost==null)return null;
  if(price.unit==='person')return price.cost*travelers;
  if(price.unit==='group')return price.cost;
  if(price.unit==='night'||price.unit==='room')return price.cost*nights;
  if(type==='accommodation')return price.cost*nights;
  return price.cost;
}
function haversineKm(a:Coord,b:Coord){const r=6371,rad=(d:number)=>d*Math.PI/180;const dLat=rad(b.latitude-a.latitude),dLon=rad(b.longitude-a.longitude);const x=Math.sin(dLat/2)**2+Math.cos(rad(a.latitude))*Math.cos(rad(b.latitude))*Math.sin(dLon/2)**2;return r*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));}
function routeEstimate(items:any[]){let km=0;const segments:any[]=[];for(let i=1;i<items.length;i++){const a=items[i-1],b=items[i];if(a.latitude==null||a.longitude==null||b.latitude==null||b.longitude==null)continue;const distance=Number(haversineKm({latitude:a.latitude,longitude:a.longitude},{latitude:b.latitude,longitude:b.longitude}).toFixed(2));const minutes=Math.ceil(distance/35*60);km+=distance;segments.push({fromId:a.id,toId:b.id,distanceKm:distance,durationMinutes:minutes,provider:'haversine',confidence:'estimate'});}return {km:Number(km.toFixed(2)),minutes:segments.reduce((s,x)=>s+x.durationMinutes,0),segments};}
function keywordScore(text:string, type:string, place:any){
  const hay=[place.name,place.description,place.place_type,place.address].filter(Boolean).join(' ').toLowerCase();
  const rules:Record<string,string[]>={
    restaurant:['กิน','อาหาร','ร้านอาหาร'],
    cafe:['คาเฟ่','กาแฟ','ถ่ายรูป'],
    attraction:['ธรรมชาติ','เที่ยว','ถ่ายรูป'],
    activity:['กิจกรรม','adventure','สนุก'],
  };
  return (rules[type]||[]).filter(k=>text.toLowerCase().includes(k)&&hay.includes(k)).length*2;
}

function hasUsableHours(place:any){
  return (place.place_hours??[]).some((hours:any)=>hours.is_closed!==true&&hasText(hours.open_time)&&hasText(hours.close_time));
}
function hasUsablePrice(place:any){
  return (place.price_items??[]).some((price:any)=>price.amount_min!=null&&Number.isFinite(Number(price.amount_min)));
}
function isPlannerReadyPlace(place:any){
  const needsHours=['restaurant','cafe','attraction','activity'].includes(place.place_type);
  return hasCoordinate(place.latitude)
    && hasCoordinate(place.longitude)
    && hasText(place.description)
    && Number.isFinite(Number(place.recommended_duration_minutes))
    && Number(place.recommended_duration_minutes)>0
    && hasUsablePrice(place)
    && (!needsHours||hasUsableHours(place));
}
function isPlannerReadyEvent(event:any, req:{startDate?:string;endDate?:string}){
  return hasCoordinate(event.latitude)
    && hasCoordinate(event.longitude)
    && hasText(event.description)
    && event.event_schedules?.some((schedule:any)=>schedule.status==='scheduled'
      && hasText(schedule.starts_at)
      && (!req.startDate||schedule.starts_at>=req.startDate)
      && (!req.endDate||schedule.starts_at<=req.endDate+'T23:59:59+07:00'));
}
function plannerReadinessSummary(places:any[], eligible:any[]){
  return {
    publishedPlaces:places.length,
    requestEligiblePlaces:eligible.length,
    plannerReadyPlaces:eligible.filter(isPlannerReadyPlace).length,
    excluded:{
      missingCoordinates:eligible.filter((p:any)=>!hasCoordinate(p.latitude)||!hasCoordinate(p.longitude)).length,
      missingDescription:eligible.filter((p:any)=>!hasText(p.description)).length,
      missingDuration:eligible.filter((p:any)=>!Number.isFinite(Number(p.recommended_duration_minutes))||Number(p.recommended_duration_minutes)<=0).length,
      missingPrice:eligible.filter((p:any)=>!hasUsablePrice(p)).length,
      missingHours:eligible.filter((p:any)=>['restaurant','cafe','attraction','activity'].includes(p.place_type)&&!hasUsableHours(p)).length,
    }
  };
}

export async function POST(request:Request){
  let body:any;
  try{body=await request.json();}catch{return NextResponse.json({error:'Invalid JSON body'},{status:400});}
  const text=String(body?.input||'').trim();
  if(!text)return NextResponse.json({error:'กรุณาระบุความต้องการของทริป'},{status:400});
  const req=parseRequest(text,body?.startDate,body?.endDate);
  const supabase=await createClient();

  const [{data:places,error:placeError},{data:events,error:eventError}]=await Promise.all([
    supabase.from('places').select('id,name,slug,description,place_type,address,latitude,longitude,max_group_size,pet_friendly,child_friendly,recommended_duration_minutes,place_hours(day_of_week,open_time,close_time,is_closed),price_items(label,amount_min,amount_max,currency,price_unit,is_estimate)').eq('publication_status','published'),
    supabase.from('events').select('id,name,slug,description,address,temporary_venue_name,latitude,longitude,event_schedules(starts_at,ends_at,status),price_items(label,amount_min,amount_max,currency,price_unit,is_estimate)').eq('publication_status','published')
  ]);
  if(placeError)return NextResponse.json({error:placeError.message},{status:500});
  if(eventError)return NextResponse.json({error:eventError.message},{status:500});

  const publishedPlaces=places??[];
  const eligible=publishedPlaces.filter((p:any)=>{
    if(p.max_group_size!=null&&Number(p.max_group_size)<req.travelers)return false;
    if(req.pet&&p.pet_friendly===false)return false;
    if(req.family&&p.child_friendly===false)return false;
    return true;
  });
  const readiness=plannerReadinessSummary(publishedPlaces,eligible);
  const plannerReady=eligible.filter(isPlannerReadyPlace);
  if(!plannerReady.length){
    return NextResponse.json({
      error:'ยังไม่มีสถานที่ที่มีข้อมูลพร้อมสำหรับสร้างแผนทริปอย่างน่าเชื่อถือ',
      dataReadiness:readiness,
      nextStep:'เพิ่มพิกัด รายละเอียด ระยะเวลาที่แนะนำ ราคา และเวลาเปิด–ปิดให้กับสถานที่อย่างน้อยหนึ่งชุดต่อหมวดหมู่'
    },{status:422});
  }

  const mapped=plannerReady.map((p:any)=>{
    const price=priceOf(p.price_items??[]);
    const estimatedCost=estimateCost(price,req.travelers,req.nights,p.place_type);
    let score=keywordScore(text,p.place_type,p);
    if(p.place_type==='accommodation')score+=3;
    if(req.pet&&p.pet_friendly===true)score+=5;
    if(req.family&&p.child_friendly===true)score+=3;
    if(p.recommended_duration_minutes!=null)score+=1;
    if(price.cost!=null)score+=1;
    return {kind:'place',id:p.id,name:p.name,slug:p.slug,type:p.place_type,location:p.address,latitude:p.latitude,longitude:p.longitude,cost:estimatedCost,unit:price.unit,priceStatus:price.status,duration:p.recommended_duration_minutes??null,score,reason:[
      req.pet&&p.pet_friendly===true?'รองรับสัตว์เลี้ยง':'',
      req.family&&p.child_friendly===true?'เหมาะกับครอบครัว':'',
      keywordScore(text,p.place_type,p)>0?'ตรงกับความสนใจของทริป':'',
      'ผ่านเกณฑ์ข้อมูลพร้อมใช้สำหรับ Planner',
    ].filter(Boolean).join(' · ')};
  });

  const budget=req.budgetTotal;
  const dayCount=Math.max(1,req.nights+1);
  const maxVisitMinutes=Math.max(300, Math.floor(540/dayCount));
  const accommodation=mapped.filter(x=>x.type==='accommodation').sort((a,b)=>b.score-a.score);
  const selected:any[]=[];
  let runningCost=0;
  const chooseWithinBudget=(items:any[], required=false)=>{
    for(const candidate of [...items].sort((a,b)=>b.score-a.score)){
      if(selected.some(x=>x.id===candidate.id)) continue;
      const nextCost=runningCost+(candidate.cost??0);
      if(budget!=null && candidate.cost!=null && nextCost>budget) continue;
      if(!required && candidate.duration!=null && candidate.duration>maxVisitMinutes) continue;
      selected.push(candidate); runningCost+=candidate.cost??0; return candidate;
    }
    return null;
  };
  chooseWithinBudget(accommodation,true);

  const categories=['attraction','activity','restaurant','cafe'];
  for(const type of categories){
    const candidates=mapped.filter(x=>x.type===type);
    chooseWithinBudget(candidates);
  }

  const eventItems=(events??[]).filter((event:any)=>isPlannerReadyEvent(event,req)).map((e:any)=>{
    const price=priceOf(e.price_items??[]);
    return {kind:'event',id:e.id,name:e.name,slug:e.slug,type:'event',location:e.temporary_venue_name||e.address,latitude:e.latitude,longitude:e.longitude,cost:estimateCost(price,req.travelers,req.nights,'event'),unit:price.unit,priceStatus:price.status,duration:null,score:2,reason:'Event ที่เผยแพร่ มีข้อมูลสถานที่ และมีรอบตรงกับช่วงเดินทาง'};
  });
  chooseWithinBudget(eventItems);

  // Fill remaining itinerary capacity with high-scoring candidates, while respecting
  // the daily time budget and avoiding duplicate places.
  const remaining=mapped.filter(x=>!selected.some(s=>s.id===x.id)).sort((a,b)=>b.score-a.score);
  for(const candidate of remaining){
    if(selected.length>=1+dayCount*2) break;
    if(candidate.duration!=null && candidate.duration>maxVisitMinutes) continue;
    if(budget!=null && candidate.cost!=null && runningCost+candidate.cost>budget) continue;
    selected.push(candidate); runningCost+=candidate.cost??0;
  }

  const total=selected.reduce((s,x)=>s+(x.cost??0),0);
  const budgetFit=budget==null?null:total<=budget;
  const accommodationItem=selected.find(x=>x.type==='accommodation');
  const nonStay=selected.filter(x=>x.type!=='accommodation');
  const days:any[]=Array.from({length:dayCount},(_,i)=>({day:i+1,items:[]}));
  if(accommodationItem) days[0].items.push({...accommodationItem,role:'stay'});
  // Build a route-aware sequence: each next stop is the closest remaining candidate.
  let anchor=accommodationItem ?? null;
  const remainingVisits=[...nonStay];
  while(remainingVisits.length){
    let index=0;
    if(anchor?.latitude!=null && anchor?.longitude!=null){
      let best=Infinity;
      remainingVisits.forEach((candidate:any,i:number)=>{
        if(candidate.latitude==null||candidate.longitude==null)return;
        const d=haversineKm({latitude:anchor.latitude,longitude:anchor.longitude},{latitude:candidate.latitude,longitude:candidate.longitude});
        if(d<best){best=d;index=i;}
      });
    }
    const next=remainingVisits.splice(index,1)[0];
    anchor=next;
    const dayIndex=Math.min(dayCount-1, Math.floor((days.flatMap((d:any)=>d.items).filter((x:any)=>x.role==='visit').length)/2));
    days[dayIndex].items.push({...next,role:'visit'});
  }
  const routeDays=days.map(day=>{const route=routeEstimate(day.items);return {...day,estimatedTravelKm:route.km,estimatedTravelMinutes:route.minutes,routeSegments:route.segments};});
  const itinerary=routeDays.flatMap(day=>day.items.map((item:any,index:number)=>({day:day.day,type:item.type,name:item.name,duration:item.duration,startTime:index===0?'10:00':index===1?'14:00':'18:00'})));
  const missingPrice=selected.filter(x=>x.cost==null).length;

  return NextResponse.json({plan:{
    input:text,travelers:req.travelers,budget:budget??null,budgetPerPerson:req.budgetPerPerson??null,startDate:req.startDate||null,endDate:req.endDate||null,nights:req.nights,totalEstimatedCost:total,budgetFit,costCoverage:missingPrice===0?'complete':total>0?'partial':'missing',items:selected,itinerary,days:routeDays,routeKm:routeDays.reduce((s,d)=>s+d.estimatedTravelKm,0),routeMinutes:routeDays.reduce((s,d)=>s+d.estimatedTravelMinutes,0),dataReadiness:readiness,
    limitations:[
      'การจัดลำดับนี้เลือกเฉพาะสถานที่ Published ที่ผ่านเกณฑ์ข้อมูลพร้อมใช้ของ GepPao',
      'เส้นทางเป็น Estimate จากพิกัดและความเร็วเฉลี่ย 35 km/h; ยังไม่ใช่เวลา Google Maps แบบ real-time',
      budgetFit===false?'ยอดประมาณการเกินงบที่ระบุ จึงควรปรับจำนวนกิจกรรม/ตัวเลือก':'',
      'ควรตรวจสอบราคา เวลาเปิด–ปิด และรอบ Event ก่อนเดินทาง'
    ].filter(Boolean)
  }});
}
