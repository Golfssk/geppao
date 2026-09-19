import {notFound,redirect} from 'next/navigation';
import {getAdminContext} from '@/lib/admin-access';
import {AdminPlaceCuration} from '@/components/admin/AdminPlaceCuration';
export const dynamic='force-dynamic';
export default async function CuratePlace({params}:{params:Promise<{id:string}>}){const{id}=await params,{supabase,user,admin}=await getAdminContext();if(!user)redirect('/host/login');if(!admin)redirect('/');const{data:place}=await supabase.from('places').select('id,name,place_type,description,address,latitude,longitude,recommended_duration_minutes,price_data_status,price_data_note,place_hours(day_of_week,open_time,close_time,is_closed,crosses_midnight),price_items(label,amount_min,amount_max,price_unit,is_estimate),place_images(id,image_url,sort_order,is_cover,alt_text)').eq('id',id).is('business_id',null).maybeSingle();if(!place)notFound();return <AdminPlaceCuration place={place as any}/>}
