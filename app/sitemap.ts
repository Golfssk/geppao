import type {MetadataRoute} from 'next';
import {createClient} from '@supabase/supabase-js';
import {destinations} from '@/lib/editorial';

const base='https://geppao.vercel.app';
export const revalidate=3600;

export default async function sitemap():Promise<MetadataRoute.Sitemap>{
  const core:MetadataRoute.Sitemap=[
    {url:base,changeFrequency:'daily',priority:1},
    {url:`${base}/stories`,changeFrequency:'daily',priority:.9},
    {url:`${base}/go`,changeFrequency:'weekly',priority:.9},
    {url:`${base}/search`,changeFrequency:'weekly',priority:.8},
    {url:`${base}/planner`,changeFrequency:'weekly',priority:.9},
    {url:`${base}/events`,changeFrequency:'daily',priority:.7},
    {url:`${base}/contact`,changeFrequency:'monthly',priority:.5}
  ];
  const destinationEntries:MetadataRoute.Sitemap=destinations.map(item=>({
    url:`${base}/go/${item.slug}`,changeFrequency:'weekly',priority:.8
  }));
  try{
    const supabase=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,{auth:{persistSession:false}});
    const[articleResult,placeResult]=await Promise.all([
      supabase.from('articles').select('slug,updated_at,published_at').eq('publication_status','published').lte('published_at',new Date().toISOString()).order('published_at',{ascending:false}).limit(500),
      supabase.from('places').select('slug,updated_at').eq('publication_status','published').order('updated_at',{ascending:false}).limit(1000)
    ]);
    const articles:MetadataRoute.Sitemap=(articleResult.data??[]).map(item=>({url:`${base}/stories/${item.slug}`,lastModified:item.updated_at??item.published_at??undefined,changeFrequency:'weekly',priority:.75}));
    const places:MetadataRoute.Sitemap=(placeResult.data??[]).map(item=>({url:`${base}/places/${item.slug}`,lastModified:item.updated_at??undefined,changeFrequency:'weekly',priority:.7}));
    return core.concat(destinationEntries,articles,places);
  }catch{
    return core.concat(destinationEntries);
  }
}
