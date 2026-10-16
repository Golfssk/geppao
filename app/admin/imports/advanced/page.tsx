import Link from 'next/link';import {redirect} from 'next/navigation';import {getAdminContext} from '@/lib/admin-access';import {PlaceImportQueue} from '@/components/admin/PlaceImportQueue';
export const dynamic='force-dynamic';
export default async function Advanced(){const{user,admin}=await getAdminContext();if(!user)redirect('/host/login');if(!admin)redirect('/');return <main className="page"><Link href="/admin/imports">← กลับไปข้อมูลที่นำเข้า</Link><h1>เครื่องมือนำเข้าขั้นสูง</h1><p>สำหรับทีมเทคนิคเท่านั้น ไม่จำเป็นสำหรับข้อมูล Excel ที่นำเข้าแล้ว</p><PlaceImportQueue/></main>}
