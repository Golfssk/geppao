export function validDate(value:unknown):value is string {
 return typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value+'T00:00:00Z'))&&new Date(value+'T00:00:00Z').toISOString().slice(0,10)===value;
}
export function validatePlannerInput(body:any):string|null {
 if(!body||typeof body!=='object'||Array.isArray(body))return 'ข้อมูลทริปไม่ถูกต้อง';
 if(typeof body.input!=='string'||!body.input.trim()||body.input.length>1000)return 'กรุณาระบุรายละเอียดทริปไม่เกิน 1,000 ตัวอักษร';
 if(!validDate(body.startDate)||!validDate(body.endDate))return 'กรุณาเลือกวันเริ่มและวันสิ้นสุดที่ถูกต้อง';
 const nights=(Date.parse(body.endDate)-Date.parse(body.startDate))/86400000;
 if(nights<0||nights>13)return 'เลือกช่วงเดินทางตั้งแต่ 1 ถึง 14 วัน';
 if(body.preferences?.tripMode==='day_trip'&&nights!==0)return 'ทริปวันเดียวต้องเริ่มและสิ้นสุดวันเดียวกัน';
 if(body.travelers!==undefined&&(!Number.isInteger(body.travelers)||body.travelers<1||body.travelers>30))return 'จำนวนผู้เดินทางต้องอยู่ระหว่าง 1 ถึง 30 คน';
 if(body.budgetTotal!==undefined&&body.budgetTotal!==null&&(!Number.isFinite(body.budgetTotal)||body.budgetTotal<0||body.budgetTotal>1000000))return 'งบรวมต้องอยู่ระหว่าง 0 ถึง 1,000,000 บาท';
 if(body.preferences?.tripMode!==undefined&&!['day_trip','overnight'].includes(body.preferences.tripMode))return 'รูปแบบทริปไม่ถูกต้อง';
 return null;
}
// Preview slots are estimates, not a claim that a venue is open or an event is bookable.
export function scheduleDay(items:any[],segments:any[]){
 let clock=9*60;
 return items.map((item,index)=>{
  if(index>0)clock+=Number(segments.find(s=>s.toId===item.id)?.durationMinutes||0)+15;
  const duration=Number(item.duration);
  const startMinutes=clock;
  const known=Number.isFinite(duration)&&duration>0;
  clock+=known?duration:60;
  const time=(n:number)=>n<24*60?`${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`:null;
  return {id:item.id,name:item.name,type:item.type,duration:item.duration,startTime:known?time(startMinutes):null,endTime:known?time(clock):null,needsReview:!known||clock>18*60};
 });
}
export function budgetAssessment(items:Array<{cost:number|null}>,budget:number|null|undefined){
 const total=items.reduce((sum,item)=>sum+(item.cost??0),0),missing=items.some(item=>item.cost==null);
 return {total,budgetFit:budget==null||missing?null:total<=budget,costCoverage:missing?(total>0?'partial':'missing'):'complete'};
}

export function thaiTime(value:unknown):string {
 if(typeof value!=='string'||!Number.isFinite(Date.parse(value)))return '';
 const date=new Date(Date.parse(value)+7*3600000);return date.toISOString().slice(11,16);
}
export function schedulePatch(serviceDate:string,time:string,duration:number){
 if(!validDate(serviceDate)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)||!Number.isInteger(duration)||duration<1||duration>1440)return null;
 const startsAt=`${serviceDate}T${time}:00+07:00`;
 return {startsAt,endsAt:new Date(Date.parse(startsAt)+duration*60000).toISOString(),durationMinutes:duration};
}
