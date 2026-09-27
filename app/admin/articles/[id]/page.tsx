import {redirect,notFound} from 'next/navigation';
import {getAdminContext} from '@/lib/admin-access';
import {ArticleEditor} from '@/components/admin/ArticleEditor';
export const dynamic='force-dynamic';
export default async function EditArticle({params}:{params:Promise<{id:string}>}){const{id}=await params;const{supabase,user,admin}=await getAdminContext();if(!user)redirect('/host/login');if(!admin)redirect('/');const[{data:article},{data:destinations}]=await Promise.all([supabase.from('articles').select('*').eq('id',id).maybeSingle(),supabase.from('destinations').select('id,name').order('name')]);if(!article)notFound();return <main className="page"><div className="container section"><span className="eyebrow">Editorial CMS</span><h1>แก้ไขบทความ</h1><p className="muted">{article.title}</p><ArticleEditor article={article} destinations={destinations??[]}/></div></main>}
