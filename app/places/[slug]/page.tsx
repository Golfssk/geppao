import {notFound} from 'next/navigation';
import {createClient} from '@/lib/supabase/server';
import {TrackOnMount} from '@/components/analytics/TrackOnMount';
import {TrackedLink} from '@/components/analytics/TrackedLink';

export const dynamic = 'force-dynamic';
const DAYS = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];

export default async function PlaceDetail({params}: {params: Promise<{slug: string}>}) {
  const {slug} = await params;
  const supabase = await createClient();
  const {data: place} = await supabase
    .from('places')
    .select('id,name,slug,place_type,description,address,phone,latitude,longitude,google_maps_url,recommended_duration_minutes,pet_friendly,child_friendly,accessibility_supported,parking_available,reservation_required,verification_status,last_verified_at,place_images(image_url,alt_text,is_cover,sort_order),place_hours(day_of_week,open_time,close_time,is_closed,crosses_midnight),price_items(label,amount_min,amount_max,currency,price_unit,is_estimate),accommodation_details(check_in_time,check_out_time)')
    .eq('slug', slug)
    .eq('publication_status', 'published')
    .maybeSingle();

  if (!place) notFound();
  const images = [...(place.place_images ?? [])].sort((a: any, b: any) => Number(b.is_cover) - Number(a.is_cover) || a.sort_order - b.sort_order);
  const mapUrl = place.google_maps_url || (place.latitude != null && place.longitude != null
    ? `https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}`
    : null);

  return <main className="page"><TrackOnMount eventName="place_view" placeId={place.id} metadata={{placeType: place.place_type}}/><div className="container section"><p className="eyebrow">{place.place_type} · PUBLISHED LOCAL DATA</p><h1>{place.name}</h1><p className="muted">{place.address || 'ยังไม่มีที่อยู่ที่ยืนยัน'}</p>{images[0]&&<img src={images[0].image_url} alt={images[0].alt_text || place.name} style={{width:'100%',maxHeight:520,objectFit:'cover',borderRadius:20,margin:'20px 0'}}/>}<div className="dashboard-grid"><section className="dashboard-card"><h2>ข้อมูลสถานที่</h2><p>{place.description || 'ยังไม่มีคำอธิบายที่ยืนยัน'}</p><p className="muted">Recommended duration: {place.recommended_duration_minutes ? `${place.recommended_duration_minutes} นาที` : 'ยังไม่มีข้อมูล'}</p><p className="muted">ตรวจล่าสุด: {place.last_verified_at ? new Date(place.last_verified_at).toLocaleDateString('th-TH') : 'ยังไม่มีข้อมูล'}</p><div className="form-actions">{mapUrl&&<TrackedLink className="btn btn-rust" href={mapUrl} target="_blank" eventName="google_maps_opened" placeId={place.id}>เปิด Google Maps ↗</TrackedLink>}{place.phone&&<TrackedLink className="btn btn-sage" href={`tel:${place.phone}`} eventName="contact_clicked" placeId={place.id}>โทร {place.phone}</TrackedLink>}</div></section><section className="dashboard-card"><h2>เวลา</h2>{place.accommodation_details?.[0]?.check_in_time||place.accommodation_details?.[0]?.check_out_time?<><p>Check-in: {place.accommodation_details?.[0]?.check_in_time || 'ยังไม่มีข้อมูล'}</p><p>Check-out: {place.accommodation_details?.[0]?.check_out_time || 'ยังไม่มีข้อมูล'}</p></>:place.place_hours?.length?<div>{[...(place.place_hours as any[])].sort((a,b)=>a.day_of_week-b.day_of_week).map(hour=><p key={hour.day_of_week}>{DAYS[hour.day_of_week]}: {hour.is_closed?'ปิด':`${hour.open_time}–${hour.close_time}${hour.crosses_midnight?' (ข้ามวัน)':''}`}</p>)}</div>:<p className="muted">ยังไม่มีเวลาเปิด–ปิดที่ยืนยัน</p>}</section><section className="dashboard-card"><h2>ราคา</h2>{place.price_items?.length?place.price_items.map((price:any)=><p key={`${price.label}-${price.price_unit}`}>{price.label}: {Number(price.amount_min).toLocaleString()} {price.currency} / {price.price_unit}{price.is_estimate?' (Estimate)':''}</p>):<p className="muted">ยังไม่มีรายการราคาที่ใช้คำนวณได้</p>}</section><section className="dashboard-card"><h2>เงื่อนไข</h2><p>สัตว์เลี้ยง: {place.pet_friendly===true?'รองรับ':place.pet_friendly===false?'ไม่รองรับ':'ยังไม่มีข้อมูล'}</p><p>เด็ก: {place.child_friendly===true?'เหมาะสม':place.child_friendly===false?'ไม่ระบุว่าเหมาะสม':'ยังไม่มีข้อมูล'}</p><p>Accessibility: {place.accessibility_supported===true?'รองรับ':place.accessibility_supported===false?'ไม่รองรับ':'ยังไม่มีข้อมูล'}</p><p>ที่จอดรถ: {place.parking_available===true?'มี':place.parking_available===false?'ไม่มี':'ยังไม่มีข้อมูล'}</p><p>ต้องจอง: {place.reservation_required?'ใช่':'ไม่ระบุว่าต้องจอง'}</p></section></div></div></main>;
}
