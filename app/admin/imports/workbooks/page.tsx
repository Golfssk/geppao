import {redirect} from 'next/navigation';
import {getAdminContext} from '@/lib/admin-access';
import {workbookQuery} from '@/lib/workbooks/query';
import {loadWorkbookData} from '@/lib/workbooks/server';
import {WorkbookArchive,WorkbookArchiveError} from '@/components/admin/WorkbookArchive';
export const dynamic='force-dynamic';
export default async function Workbooks({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const {supabase,user,admin}=await getAdminContext();if(!user)redirect('/host/login');if(!admin)redirect('/');
 try{const query=workbookQuery(await searchParams),data=await loadWorkbookData(supabase,query);return <WorkbookArchive data={data} sheet={query.sheet}/>}
 catch{return <WorkbookArchiveError/>}
}
