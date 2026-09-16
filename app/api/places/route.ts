import {NextResponse} from 'next/server';
import {createClient} from '@/lib/supabase/server';
import {mapPlace} from '@/lib/places';
export async function GET(){const supabase=await createClient();const {data,error}=await supabase.from('places').select('*, place_images(id,image_url,alt_text,sort_order,is_cover), price_items(id,label,amount_min,amount_max,currency,price_unit,is_estimate)').eq('publication_status','published').order('name').limit(100);if(error)return NextResponse.json({error:error.message,setupRequired:true},{status:503});return NextResponse.json((data??[]).map(mapPlace));}
