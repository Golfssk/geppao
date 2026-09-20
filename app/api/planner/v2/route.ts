import {NextResponse} from 'next/server';
import {createClient} from '@/lib/supabase/server';

type PriceStatus = 'missing' | 'estimated' | 'confirmed';
type Price = {cost:number|null; status:PriceStatus; unit:string|null};

const number=(value:string, pattern:RegExp)=>{const m=value.match(pattern);return m?Number(m[1].replace(/,/g,'')):undefined;};

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

export async function POST(request:Request){
  let body:any;
  try{body=await request.json();}catch{return NextResponse.json({error:'Invalid JSON body'},{status:400});}
  const text=String(body?.input||'').trim();
  if(!text)return NextResponse.json({error:'กรุณาระบุความต้องการของทริป'},{status:400});
  const req=parseRequest(text,body?.startDate,body?.endDate);
  const supabase=await createClient();

  const [{data:places,error:placeError},{data:events,error:eventError}]=await Promise.all([
    supabase.from('places').select('id,name,slug,description,place_type,address,max_group_size,pet_friendly,child_friendly,recommended_duration_minutes,place_hours(day_of_week,open_time,close_time,is_closed),price_items(label,amount_min,amount_max,currency,price_unit,is_estimate)').eq('publication_status','published'),
    supabase.from('events').select('id,name,slug,description,address,temporary_venue_name,event_schedules(starts_at,ends_at,status),price_items(label,amount_min,amount_max,currency,price_unit,is_estimate)').eq('publication_status','published')
  ]);
  if(placeError)return NextResponse.json({error:placeError.message},{status:500});
  if(eventError)return NextResponse.json({error:eventError.message},{status:500});

  const eligible=(places??[]).filter((p:any)=>{
    if(p.max_group_size!=null&&Number(p.max_group_size)<req.travelers)return false;
    if(req.pet&&p.pet_friendly===false)return false;
    if(req.family&&p.child_friendly===false)return false;
    return true;
  });

  const mapped=eligible.map((p:any)=>{
    const price=priceOf(p.price_items??[]);
    const estimatedCost=estimateCost(price,req.travelers,req.nights,p.place_type);
    let score=keywordScore(text,p.place_type,p);
    if(p.place_type==='accommodation')score+=3;
    if(req.pet&&p.pet_friendly===true)score+=5;
    if(req.family&&p.child_friendly===true)score+=3;
    if(p.recommended_duration_minutes!=null)score+=1;
    if(price.cost!=null)score+=1;
    return {kind:'place',id:p.id,name:p.name,slug:p.slug,type:p.place_type,location:p.address,cost:estimatedCost,unit:price.unit,priceStatus:price.status,duration:p.recommended_duration_minutes??null,score,reason:[
      req.pet&&p.pet_friendly===true?'รองรับสัตว์เลี้ยง':'',
      req.family&&p.child_friendly===true?'เหมาะกับครอบครัว':'',
      keywordScore(text,p.place_type,p)>0?'ตรงกับความสนใจของทริป':'',
      price.cost!=null?'มีข้อมูลราคา':'',
    ].filter(Boolean).join(' · ')||'ตรงกับข้อมูลพื้นฐานของทริป'};
  });

  const accommodation=mapped.filter(x=>x.type==='accommodation').sort((a,b)=>b.score-a.score);
  const categories=['restaurant','cafe','attraction','activity'];
  const selected:any[]=[];
  if(accommodation[0])selected.push(accommodation[0]);
  for(const type of categories){
    const candidate=mapped.filter(x=>x.type===type).sort((a,b)=>b.score-a.score)[0];
    if(candidate)selected.push(candidate);
  }

  const eventItems=(events??[]).filter((e:any)=>e.event_schedules?.some((s:any)=>s.status==='scheduled'&&(!req.startDate||s.starts_at>=req.startDate)&&(!req.endDate||s.starts_at<=req.endDate+'T23:59:59+07:00'))).map((e:any)=>{
    const price=priceOf(e.price_items??[]);
    return {kind:'event',id:e.id,name:e.name,slug:e.slug,type:'event',location:e.temporary_venue_name||e.address,cost:estimateCost(price,req.travelers,req.nights,'event'),unit:price.unit,priceStatus:price.status,duration:null,score:2,reason:'Event ที่เผยแพร่และมีรอบตรงกับช่วงเดินทาง'};
  });
  if(eventItems[0])selected.push(eventItems[0]);

  const total=selected.reduce((s,x)=>s+(x.cost??0),0);
  const budget=req.budgetTotal;
  const budgetFit=budget==null?null:total<=budget;
  const dayCount=Math.max(1,req.nights+1);
  const itinerary=selected.map((item,index)=>({day:Math.min(dayCount,index+1),type:item.type,name:item.name,duration:item.duration,startTime:index===0?'14:00':index===selected.length-1?'18:00':null}));
  const missingPrice=selected.filter(x=>x.cost==null).length;

  return NextResponse.json({plan:{
    input:text,travelers:req.travelers,budget:budget??null,budgetPerPerson:req.budgetPerPerson??null,startDate:req.startDate||null,endDate:req.endDate||null,nights:req.nights,totalEstimatedCost:total,budgetFit,costCoverage:missingPrice===0?'complete':total>0?'partial':'missing',items:selected,itinerary,
    limitations:[
      'การจัดลำดับนี้ใช้ข้อมูล Published จริงจาก GepPao',
      'ยังไม่คำนวณระยะทาง/เวลาเดินทางจริงระหว่างสถานที่',
      missingPrice?'บางรายการยังไม่มีราคาที่ใช้คำนวณได้':'',
      budgetFit===false?'ยอดประมาณการเกินงบที่ระบุ จึงควรปรับจำนวนกิจกรรม/ตัวเลือก':'',
      'ควรตรวจสอบราคา เวลาเปิด–ปิด และรอบ Event ก่อนเดินทาง'
    ].filter(Boolean)
  }});
}
