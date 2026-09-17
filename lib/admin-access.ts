import {createClient} from '@/lib/supabase/server';
export async function getAdminContext(){const supabase=await createClient();const{data:{user}}=await supabase.auth.getUser();if(!user)return{supabase,user:null,admin:null};const{data:admin}=await supabase.from('admin_users').select('role').eq('user_id',user.id).maybeSingle();return{supabase,user,admin};}
