import {NextResponse} from 'next/server';
import {getAdminContext} from '@/lib/admin-access';
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}){
 const{supabase,user,admin}=await getAdminContext();if(!user)return NextResponse.json({error:'กรุณาเข้าสู่ระบบ'},{status:401});if(!admin)return NextResponse.json({error:'ไม่มีสิทธิ์ Admin'},{status:403});
 if(request.headers.get('origin')!==new URL(request.url).origin)return NextResponse.json({error:'คำขอไม่ถูกต้อง'},{status:403});
 const{id}=await params;if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))return NextResponse.json({error:'ID ไฟล์ไม่ถูกต้อง'},{status:400});
 const{data,error}=await supabase.rpc('admin_publish_workbook',{p_batch:id}).abortSignal(AbortSignal.timeout(25000));
 return error?NextResponse.json({error:'ยังนำข้อมูลขึ้นเว็บไม่ได้ กรุณาลองใหม่ ข้อมูลเดิมยังอยู่ครบ'},{status:503}):NextResponse.json(data);
}
