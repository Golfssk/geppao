import {lookup} from 'node:dns/promises';
import {request} from 'node:https';
import {BlockList,isIP} from 'node:net';
import {cleanSourceUrl,restrictedAsset,linkKind} from './links';
const denied=new BlockList();
for(const[base,prefix]of [['0.0.0.0',8],['10.0.0.0',8],['100.64.0.0',10],['127.0.0.0',8],['169.254.0.0',16],['172.16.0.0',12],['192.0.0.0',24],['192.0.2.0',24],['192.168.0.0',16],['198.18.0.0',15],['198.51.100.0',24],['203.0.113.0',24],['224.0.0.0',3]]as const)denied.addSubnet(base,prefix,'ipv4');
const globalV6=new BlockList();globalV6.addSubnet('2000::',3,'ipv6');
denied.addSubnet('2001::',23,'ipv6');denied.addSubnet('2001:db8::',32,'ipv6');denied.addSubnet('2002::',16,'ipv6');denied.addSubnet('3fff::',20,'ipv6');
export function publicAddress(ip:string){const v=isIP(ip);return v===4?!denied.check(ip,'ipv4'):v===6&&globalV6.check(ip,'ipv6')&&!denied.check(ip,'ipv6');}
type Mode='page'|'image'|'maps_redirect';
function permitted(url:URL,mode:Mode){if(mode==='maps_redirect'){if(!['maps.app.goo.gl','goo.gl'].includes(url.hostname))throw new Error('ไม่ใช่ลิงก์แผนที่แบบย่อ');}else if(restrictedAsset(url))throw new Error('แหล่งนี้รับเป็นลิงก์อ้างอิงเท่านั้น ไม่คัดลอกเนื้อหาหรือรูป');}
export async function readPublicResource(input:string,mode:Mode):Promise<{url:string;body:Buffer;type:string;location?:string}>{
 let url=cleanSourceUrl(input);const deadline=Date.now()+12000;
 for(let hop=0;hop<4;hop++){
  permitted(url,mode);const remaining=deadline-Date.now();if(remaining<=0)throw new Error('เว็บไซต์ตอบกลับช้า กรุณาลองใหม่');
  // Pin the validated DNS address to the TLS request; no second resolver/redirect bypass.
  const records=await Promise.race([lookup(url.hostname,{all:true}),new Promise<never>((_,reject)=>{const t=setTimeout(()=>reject(new Error('ค้นหาเว็บไซต์ไม่สำเร็จ')),Math.min(remaining,4000));t.unref();})]);
  if(!records.length||records.some(r=>!publicAddress(r.address)))throw new Error('ไม่อนุญาตลิงก์เครือข่ายภายใน');const pinned=records[0];
  const result=await new Promise<{body:Buffer;type:string;location?:string}>((resolve,reject)=>{
   const req=request(url,{method:'GET',headers:{'User-Agent':'GepPao-Owner-Import/1.0','Accept':mode==='image'?'image/jpeg,image/png,image/webp':'text/html','Accept-Encoding':'identity'},lookup:(_hostname,options,callback)=>{if(options.all)callback(null,[{address:pinned.address,family:pinned.family}]);else(callback as unknown as (err:Error|null,address:string,family:number)=>void)(null,pinned.address,pinned.family)}},res=>{
    const status=res.statusCode??0,location=res.headers.location;
    if([301,302,303,307,308].includes(status)&&location){res.destroy();resolve({body:Buffer.alloc(0),type:'',location});return;}
    if(status<200||status>=300){res.destroy();reject(new Error('เว็บไซต์ไม่อนุญาตให้อ่านข้อมูล ใช้ลิงก์นี้อ้างอิงแล้วเติมข้อมูลต่อได้'));return;}
    if(mode==='maps_redirect'){res.destroy();resolve({body:Buffer.alloc(0),type:''});return;}
    const type=(res.headers['content-type']??'').split(';')[0].trim().toLowerCase(),max=mode==='image'?5*1024*1024:1024*1024;
    if((res.headers['content-encoding']&&res.headers['content-encoding']!=='identity')||Number(res.headers['content-length']??0)>max||(mode==='page'?!['text/html','application/xhtml+xml'].includes(type):!['image/jpeg','image/png','image/webp'].includes(type))){res.destroy();reject(new Error(mode==='image'?'ใช้รูป JPG, PNG หรือ WebP ไม่เกิน 5 MB':'หน้าเว็บต้องเป็น HTML ขนาดไม่เกิน 1 MB'));return;}
    const parts:Buffer[]=[];let size=0;res.on('data',(part:Buffer)=>{size+=part.length;if(size>max){reject(new Error('ข้อมูลมีขนาดใหญ่เกินไป'));res.destroy();return;}parts.push(part)});res.on('end',()=>resolve({body:Buffer.concat(parts),type}));res.on('error',reject);
   });
   req.on('error',reject);const timer=setTimeout(()=>req.destroy(new Error('เว็บไซต์ตอบกลับช้า กรุณาลองใหม่')),Math.min(8000,Math.max(1,deadline-Date.now())));req.on('close',()=>clearTimeout(timer));req.end();
  });
  if(result.location){const next=cleanSourceUrl(new URL(result.location,url).toString());if(mode==='maps_redirect'&&linkKind(next)==='google_maps'&&!['maps.app.goo.gl','goo.gl'].includes(next.hostname))return{url:next.toString(),body:Buffer.alloc(0),type:''};url=next;continue;}
  return{url:url.toString(),...result};
 }
 throw new Error('ลิงก์เปลี่ยนเส้นทางหลายครั้งเกินไป');
}
export function imageExtension(bytes:Buffer,type:string){if(type==='image/jpeg'&&bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff)return'jpg';if(type==='image/png'&&bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))return'png';if(type==='image/webp'&&bytes.subarray(0,4).toString()==='RIFF'&&bytes.subarray(8,12).toString()==='WEBP')return'webp';throw new Error('เนื้อหาไฟล์ไม่ตรงกับชนิดรูปที่รองรับ');}
