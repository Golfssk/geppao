import {NextResponse} from 'next/server';
import {getBusinessContext} from '@/lib/business-access';
import {cleanSourceUrl,findPlaceMatches,linkKind,LINK_LABELS,mapHints} from '@/lib/business-import/links';
import {readPublicResource} from '@/lib/business-import/network';
import {extractOwnerMetadata,type ImportFields} from '@/lib/business-import/metadata';
import {sameOrigin,smallJson} from '@/lib/business-import/request';
export const runtime='nodejs';
export async function POST(request:Request){
 const{supabase,user,business}=await getBusinessContext();if(!user)return NextResponse.json({error:'กรุณาเข้าสู่ระบบ'},{status:401});if(!business)return NextResponse.json({error:'กรุณาสร้างโปรไฟล์ธุรกิจก่อน'},{status:403});
 try{
  sameOrigin(request);const body=await smallJson(request);let url=cleanSourceUrl(body.url),kind=linkKind(url),fields:ImportFields={},images:string[]=[],mode='link_only',message='';
  if(kind==='google_maps'&&['maps.app.goo.gl','goo.gl'].includes(url.hostname)){try{url=cleanSourceUrl((await readPublicResource(url.toString(),'maps_redirect')).url)}catch{message='ลิงก์แผนที่แบบย่อยังเปิดไม่ได้ ลองคัดลอกลิงก์เต็ม หรือเติมข้อมูลต่อได้เลย';}}
  if(kind==='google_maps')fields=mapHints(url);
  if(kind==='website'&&body.ownerPermission===true){
   try{const page=await readPublicResource(url.toString(),'page');url=cleanSourceUrl(page.url);kind=linkKind(url);const result=extractOwnerMetadata(page.body.toString('utf8'),url.toString());fields=result.fields;images=result.images;mode=Object.keys(fields).some(k=>k!=='websiteUrl')?'metadata':'link_only';message=result.ambiguous?'หน้านี้มีหลายกิจการ จึงยังไม่เลือกให้อัตโนมัติ กรุณาระบุชื่อกิจการของคุณ':mode==='metadata'?'เติมข้อมูลที่เว็บไซต์เปิดเผยให้แล้ว กรุณาตรวจชื่อ ที่อยู่ และเลือกรูปที่คุณมีสิทธิ์ใช้':'เว็บไซต์นี้ไม่มีข้อมูลสถานที่ที่อ่านได้ เก็บลิงก์ให้แล้ว เติมเฉพาะข้อมูลที่ขาดได้เลย';}
   catch(e){message=e instanceof Error?e.message:'อ่านเว็บไซต์ไม่ได้ เก็บลิงก์ไว้แล้ว เติมข้อมูลต่อได้';}
  }
  const matches=await findPlaceMatches(supabase,url,fields.name||'',business.id);
  const exact=matches.filter(m=>m.reason==='source');
  if(exact.length===1){const{data,error}=await supabase.from('places').select('name,address,place_type,latitude,longitude,google_maps_url').eq('id',exact[0].id).maybeSingle();if(error)throw new Error('อ่านสถานที่เดิมไม่สำเร็จ');if(data){fields={...fields,name:data.name,address:data.address||'',type:data.place_type,latitude:data.latitude==null?'':String(data.latitude),longitude:data.longitude==null?'':String(data.longitude),googleMapsUrl:data.google_maps_url||''};mode='existing';message='พบสถานที่นี้ใน Gebpao แล้ว ไม่ต้องสร้างซ้ำ หากเป็นกิจการของคุณ ให้ขอสิทธิ์จัดการด้านล่าง';}}
  if(!message)message=kind==='website'?'เก็บลิงก์ให้แล้ว หากเป็นเว็บไซต์ของคุณ ให้ยืนยันสิทธิ์ด้านล่างเพื่อช่วยเติมข้อมูล':`เก็บลิงก์ ${LINK_LABELS[kind]} ให้แล้ว รุ่นฟรีนี้ไม่คัดลอกรูปหรือเนื้อหาจากแพลตฟอร์มนี้ แต่ตรวจสถานที่เดิมและเติมข้อมูลต่อได้`;
  return NextResponse.json({sourceUrl:url.toString(),sourceKind:kind,sourceLabel:LINK_LABELS[kind],mode,message,fields,images,matches},{headers:{'Cache-Control':'private, no-store'}});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'ตรวจลิงก์ไม่สำเร็จ กรุณาลองใหม่'},{status:400})}
}
