import {notFound, redirect} from 'next/navigation';
import {getAdminContext} from '@/lib/admin-access';
import {loadAdminCurationPlace} from '@/lib/admin/curation';
import {AdminPlaceCuration} from '@/components/admin/AdminPlaceCuration';

export const dynamic = 'force-dynamic';

export default async function CuratePlace({params}: {params: Promise<{id: string}>}) {
  const {id} = await params;
  const {supabase, user, admin} = await getAdminContext();
  if (!user) redirect('/host/login');
  if (!admin) redirect('/');
  const {data: place, error} = await loadAdminCurationPlace(supabase, id);
  if (error) throw new Error('อ่านข้อมูลสำหรับ Admin review ไม่สำเร็จ');
  if (!place) notFound();
  return <AdminPlaceCuration place={place as any}/>;
}
