import './globals.css';
import {createClient} from '@/lib/supabase/server';
import {LocaleProvider} from '@/components/i18n/LocaleProvider';
import {SiteChrome} from '@/components/navigation/SiteChrome';
export default async function RootLayout({children}:{children:React.ReactNode}){const supabase=await createClient();const{data:{user}}=await supabase.auth.getUser();const{data:admin}=user?await supabase.from('admin_users').select('user_id').eq('user_id',user.id).maybeSingle():{data:null};const metadata=(user?.user_metadata??{}) as Record<string,unknown>;const name=typeof metadata.full_name==='string'?metadata.full_name:typeof metadata.name==='string'?metadata.name:user?.email?.split('@')[0]??'Guest';return <html lang="th"><body><LocaleProvider><SiteChrome name={name} email={user?.email??null} isAdmin={Boolean(admin)}>{children}</SiteChrome></LocaleProvider></body></html>}
