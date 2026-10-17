import {redirect} from 'next/navigation';
import {createClient} from '@/lib/supabase/server';
import {TripsList} from '@/components/trips/TripsList';
export const dynamic='force-dynamic';
export default async function Trips(){const s=await createClient(),{data:{user}}=await s.auth.getUser();if(!user)redirect('/host/login?next=%2Ftrips');const{data,error}=await s.from('trips').select('id,owner_user_id,plan_revision,title,start_date,end_date,travelers,budget_total,currency,status,trip_days(id)').order('updated_at',{ascending:false});if(error)throw new Error('Could not load trips');return <TripsList trips={data??[]} currentUserId={user.id}/>}
