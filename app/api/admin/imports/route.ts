import {NextResponse} from 'next/server';
import {getAdminContext} from '@/lib/admin-access';
import {intakeRequest} from '@/lib/intake/validation';
export async function GET(request:Request){
 const{supabase,user,admin}=await getAdminContext();if(!user)return NextResponse.json({error:'กรุณาเข้าสู่ระบบ'},{status:401});if(!admin)return NextResponse.json({error:'ไม่มีสิทธิ์ Admin'},{status:403});
 const offset=Number(new URL(request.url).searchParams.get('offset')||0);if(!Number.isInteger(offset)||offset<0||offset>100000)return NextResponse.json({error:'หน้าคิวไม่ถูกต้อง'},{status:400});
 const{data,error}=await supabase.from('place_import_candidates').select('id,import_key,payload,status,source_kind,source_url,rights_basis,permission_evidence,checked_at,rights_expires_at,matched_place_id,created_at').order('created_at',{ascending:false}).order('id',{ascending:false}).range(offset,offset+49);
 return error?NextResponse.json({error:'อ่านคิวนำเข้าไม่สำเร็จ — ตรวจ migration 029/030 และสิทธิ์'},{status:500}):NextResponse.json({items:data??[],nextOffset:data?.length===50?offset+50:null});
}
export async function POST(request:Request){
 const{supabase,user,admin}=await getAdminContext();if(!user)return NextResponse.json({error:'กรุณาเข้าสู่ระบบ'},{status:401});if(!admin)return NextResponse.json({error:'ไม่มีสิทธิ์ Admin'},{status:403});
 try{const reader=request.body?.getReader();if(!reader)throw new Error('ไม่มีข้อมูล');const chunks:Uint8Array[]=[];let size=0;while(true){const{done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>32000){await reader.cancel();throw new Error('ข้อมูลมีขนาดใหญ่เกินไป')}chunks.push(value)}
 const input=intakeRequest(JSON.parse(Buffer.concat(chunks).toString('utf8'))),{data,error}=await supabase.rpc('admin_stage_place_import',input);
 return error?NextResponse.json({error:error.message},{status:error.code==='23505'?409:400}):NextResponse.json(data,{status:201});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:'ข้อมูลไม่ถูกต้อง'},{status:400})}
}
