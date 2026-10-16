import {NextResponse} from 'next/server';
import {getBusinessContext} from '@/lib/business-access';
import {cleanSourceUrl,restrictedAsset} from '@/lib/business-import/links';
import {readPublicResource,imageExtension} from '@/lib/business-import/network';
import {sameOrigin,smallJson} from '@/lib/business-import/request';
export const runtime='nodejs';
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
 const{id}=await params,{supabase,user,business}=await getBusinessContext();if(!user)return NextResponse.json({error:'กรุณาเข้าสู่ระบบ'},{status:401});if(!business)return NextResponse.json({error:'ไม่พบบัญชีธุรกิจ'},{status:403});
 try{
  sameOrigin(request);if(!/^[0-9a-f-]{36}$/i.test(id))throw new Error('สถานที่ไม่ถูกต้อง');const b=await smallJson(request);const rightsHolder=typeof b.rightsHolder==='string'?b.rightsHolder.trim().slice(0,200):'';
  if(b.rightsConfirmed!==true||!rightsHolder)throw new Error('กรุณาระบุเจ้าของภาพและยืนยันสิทธิ์ให้ Gebpao จัดเก็บและแสดงรูป');
  const source=cleanSourceUrl(b.url);if(restrictedAsset(source))throw new Error('ไม่คัดลอกรูปจาก Google Maps หรือแพลตฟอร์มจอง ใช้ลิงก์รูปต้นฉบับที่คุณมีสิทธิ์แทน');
  const{data:place,error:placeError}=await supabase.from('places').select('id,place_images(id,image_url,sort_order,is_cover)').eq('id',id).eq('business_id',business.id).maybeSingle();if(placeError)throw new Error('อ่านข้อมูลสถานที่ไม่สำเร็จ');if(!place)return NextResponse.json({error:'ไม่พบสถานที่หรือไม่มีสิทธิ์'},{status:404});if((place.place_images??[]).length>=12)throw new Error('สถานที่หนึ่งแห่งมีรูปได้สูงสุด 12 รูป');
  // Retrying the same source image reuses a deterministic object path, never overwrites.
  const {createHash}=await import('node:crypto');const digest=createHash('sha256').update(source.toString()).digest('hex').slice(0,32);
  const existing=(place.place_images??[]).find((i:any)=>i.image_url.includes(`/link-${digest}.`));if(existing)return NextResponse.json(existing);
  const asset=await readPublicResource(source.toString(),'image'),ext=imageExtension(asset.body,asset.type),path=`${business.id}/${id}/link-${digest}.${ext}`,bucket=supabase.storage.from('place-images');
  const{error:uploadError}=await bucket.upload(path,asset.body,{contentType:asset.type,upsert:false});if(uploadError)return NextResponse.json({error:'เก็บรูปไม่สำเร็จ กรุณาลองใหม่หรือใช้รูปอื่น'},{status:503});
  const imageUrl=bucket.getPublicUrl(path).data.publicUrl;
  const{data,error}=await supabase.from('place_images').insert({place_id:id,image_url:imageUrl,alt_text:typeof b.alt==='string'?b.alt.slice(0,200):null,sort_order:place.place_images?.length??0,is_cover:!place.place_images?.length,rights_holder:rightsHolder,rights_basis:'owner',permission_evidence:`Owner-authorized URL import: ${source.toString()}`,permission_date:new Date().toISOString().slice(0,10),approved_for_public:false,takedown_status:'active'}).select('id,image_url,sort_order,is_cover,alt_text,approved_for_public').single();
  if(error){await bucket.remove([path]);return NextResponse.json({error:'บันทึกรูปไม่สำเร็จ ข้อมูลสถานที่ยังอยู่ครบ ลองใหม่ได้'},{status:500})}
  return NextResponse.json(data,{status:201});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'นำเข้ารูปไม่สำเร็จ ข้อมูลสถานที่ยังอยู่ครบ'},{status:400})}
}
