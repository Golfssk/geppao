import {notFound,redirect} from 'next/navigation';
import {getAdminContext} from '@/lib/admin-access';
import {AdminPlaceCuration} from '@/components/admin/AdminPlaceCuration';

export const dynamic='force-dynamic';

export default async function CuratePlace({params}:{params:Promise<{id:string}>}){
  const{id}=await params;
  const{supabase,user,admin}=await getAdminContext();
  if(!user)redirect('/host/login');
  if(!admin)redirect('/');
  const{data:place}=await supabase
    .from('places')
    .select('id,name,place_type,description,address,latitude,longitude,recommended_duration_minutes,price_data_status,price_data_note,place_hours(day_of_week,open_time,close_time,is_closed,crosses_midnight),price_items(label,amount_min,amount_max,price_unit,is_estimate),place_images(id,image_url,sort_order,is_cover,alt_text,rights_holder,rights_basis,permission_evidence,permission_date,approved_for_public,takedown_status),place_sources(source_type,source_url,source_note,checked_at),accommodation_details(accommodation_type,room_count,maximum_guests,check_in_time,check_out_time)')
    .eq('id',id)
    .is('business_id',null)
    .maybeSingle();
  if(!place)notFound();
  return <AdminPlaceCuration place={place as any}/>;
}
