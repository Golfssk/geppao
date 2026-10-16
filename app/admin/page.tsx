import {redirect} from 'next/navigation';
import {getAdminContext} from '@/lib/admin-access';
import {AdminOverview} from '@/components/admin/AdminOverview';
import type {AdminPlace} from '@/lib/admin/query';
export const dynamic='force-dynamic';
export default async function Admin(){
 const{supabase,user,admin}=await getAdminContext();if(!user)redirect('/host/login?next=%2Fadmin');if(!admin)redirect('/');
 const results=await Promise.all([
  supabase.from('places').select('id',{count:'exact',head:true}).eq('publication_status','pending').abortSignal(AbortSignal.timeout(8000)),
  supabase.from('events').select('id',{count:'exact',head:true}).eq('publication_status','pending').abortSignal(AbortSignal.timeout(8000)),
  supabase.from('leads').select('id',{count:'exact',head:true}).eq('action','contact_form').eq('status','new').abortSignal(AbortSignal.timeout(8000)),
  supabase.from('places').select('id',{count:'exact',head:true}).eq('publication_status','published').abortSignal(AbortSignal.timeout(8000)),
  supabase.from('places').select('id,name,place_type,address,business_id,publication_status,verification_status,updated_at,businesses(name)').eq('publication_status','pending').order('updated_at',{ascending:true}).order('id').limit(5).abortSignal(AbortSignal.timeout(8000))
 ]);
 const ids=['pending','events','contacts','published'];
 return <AdminOverview metrics={results.slice(0,4).map((r,i)=>({id:ids[i],count:r.count??null,error:!!r.error}))} places={(results[4].data??[]) as unknown as AdminPlace[]} error={!!results[4].error}/>;
}
