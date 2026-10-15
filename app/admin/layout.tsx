import {redirect} from 'next/navigation';
import type {Metadata} from 'next';
import {getAdminContext} from '@/lib/admin-access';
import {AdminWorkspace} from '@/components/admin/AdminWorkspace';
import './admin.css';
export const metadata:Metadata={title:'GepPao Admin',robots:{index:false,follow:false}};
export default async function AdminLayout({children}:{children:React.ReactNode}){
 const{user,admin}=await getAdminContext();
 if(!user)redirect('/host/login?next=%2Fadmin');
 if(!admin)return <main className="container section"><h1>ไม่มีสิทธิ์ Admin / Admin access required</h1><p>บัญชีนี้ไม่ได้อยู่ในรายชื่อผู้ดูแล GepPao</p></main>;
 return <AdminWorkspace>{children}</AdminWorkspace>;
}
