import type {Metadata} from 'next';
import {createClient} from '@/lib/supabase/server';
import {mapArticle} from '@/lib/editorial';
import {EditorialCard} from '@/components/editorial/EditorialCard';
import styles from './stories.module.css';
export const metadata:Metadata={title:'เรื่องน่าอ่าน',description:'คู่มือ ไอเดียทริป ข่าว และเรื่องเล่าท้องถิ่นจาก GepPao'};
export const dynamic='force-dynamic';
export default async function StoriesPage(){const supabase=await createClient();const{data}=await supabase.from('articles').select('id,title,slug,excerpt,category,tags,cover_image_url,cover_alt_text,cover_approved_for_public,reading_minutes,is_featured,commercial_type,sponsor_name,published_at,destinations(name,slug),editorial_authors(display_name,slug)').eq('publication_status','published').lte('published_at',new Date().toISOString()).order('published_at',{ascending:false}).limit(60);const articles=(data??[]).map(mapArticle);return <main className={styles.page}><header><span className="eyebrow">GepPao Stories</span><h1>เรื่องน่าอ่านก่อนเก็บเป๋า</h1><p>คู่มือจุดหมาย แผนเที่ยว ของกิน ที่พัก ข่าว และเสียงจากคนท้องถิ่น</p></header><div className={styles.grid}>{articles.length?articles.map(article=><EditorialCard key={article.id} article={article}/>):<div className={styles.empty}><h2>กำลังเตรียมบทความชุดแรก</h2><p>จะไม่มีบทความที่สร้างข้อเท็จจริงของสถานที่ขึ้นเอง เนื้อหาจะเผยแพร่หลังผ่านการตรวจแหล่งที่มาและสิทธิ์สื่อ</p></div>}</div></main>}
