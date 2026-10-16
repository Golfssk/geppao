export function publicUrl(value:unknown):string|null {
  if(value===''||value==null)return null;
  if(typeof value!=='string'||value.length>2000)throw new Error('URL ไม่ถูกต้อง');
  try{const url=new URL(value.trim());if(!['http:','https:'].includes(url.protocol)||url.username||url.password)throw new Error();return url.toString()}catch{throw new Error('ใช้ URL แบบ http/https ที่ไม่มีข้อมูลเข้าสู่ระบบ')}
}
export function poolDetails(body:Record<string,unknown>){
  const result:Record<string,string|number|null>={};
  for(const[key,column]of Object.entries({poolType:'pool_type',bedroomCount:'bedroom_count',bathroomCount:'bathroom_count'})){
    if(!(key in body))continue;const value=body[key];if(value===''||value==null){result[column]=null;continue}
    if(key==='poolType'){if(typeof value!=='string'||!['none','shared','private'].includes(value))throw new Error('ประเภทสระไม่ถูกต้อง');result[column]=value}
    else{if(!['number','string'].includes(typeof value)||(typeof value==='string'&&!/^\d+$/.test(value)))throw new Error('จำนวนห้องต้องเป็นจำนวนเต็ม');const n=Number(value);if(!Number.isInteger(n)||n<0||n>100000)throw new Error('จำนวนห้องไม่ถูกต้อง');result[column]=n}
  }return result;
}
export function intakeRequest(value:unknown){
  if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('ต้องส่ง JSON object');const b=value as Record<string,unknown>;
  if(typeof b.import_key!=='string'||!b.import_key.trim()||b.import_key.length>200)throw new Error('ต้องระบุ import_key ที่คงเดิมเมื่อส่งซ้ำ');
  if(!b.payload||typeof b.payload!=='object'||Array.isArray(b.payload)||!b.source||typeof b.source!=='object'||Array.isArray(b.source))throw new Error('ต้องมี payload และ source');
  if(JSON.stringify(b).length>26000)throw new Error('ข้อมูลมีขนาดใหญ่เกินไป');
  return{input_key:b.import_key.trim(),input_payload:b.payload,input_source:b.source};
}
