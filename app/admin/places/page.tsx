import {redirect} from 'next/navigation';
import {getAdminContext} from '@/lib/admin-access';
import {ADMIN_PAGE_SIZE,literalContains,parseAdminQuery,type AdminPlace} from '@/lib/admin/query';
import {AdminPlaceQueue} from '@/components/admin/AdminPlaceQueue';
export const dynamic='force-dynamic';
export default async function AdminPlaces({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const{supabase,user,admin}=await getAdminContext();if(!user)redirect('/host/login?next=%2Fadmin%2Fplaces');if(!admin)redirect('/');
 const query=parseAdminQuery(await searchParams);
 let request=supabase.from('places').select('id,name,place_type,address,business_id,publication_status,verification_status,updated_at,businesses(name)',{count:'exact'});
 if(query.status!=='all')request=request.eq('publication_status',query.status);
 if(query.type)request=request.eq('place_type',query.type);
 if(query.q)request=request.ilike('name',literalContains(query.q));
 const{data,count,error}=await request.order('updated_at',{ascending:query.sort==='oldest'}).order('id').range((query.page-1)*ADMIN_PAGE_SIZE,query.page*ADMIN_PAGE_SIZE-1).abortSignal(AbortSignal.timeout(8000));
 return <AdminPlaceQueue query={query} places={(data??[]) as unknown as AdminPlace[]} total={count??null} error={!!error}/>;
}
