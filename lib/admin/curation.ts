import type {SupabaseClient} from '@supabase/supabase-js';

/** Called only after getAdminContext authorizes the requester. RLS remains authoritative. */
export async function loadAdminCurationPlace(supabase: SupabaseClient, id: string) {
  return supabase.from('places')
    .select('id,business_id,name,place_type,phone,line_id,email,website_url,facebook_url,instagram_url,booking_url,description,address,latitude,longitude,recommended_duration_minutes,price_data_status,price_data_note,place_hours(day_of_week,open_time,close_time,is_closed,crosses_midnight),price_items(label,amount_min,amount_max,price_unit,is_estimate),place_images(id,image_url,sort_order,is_cover,alt_text,rights_holder,rights_basis,permission_evidence,permission_date,approved_for_public,takedown_status),place_sources(source_type,source_url,source_note,checked_at),accommodation_details(accommodation_type,room_count,maximum_guests,check_in_time,check_out_time,pool_type,bedroom_count,bathroom_count)')
    .eq('id', id)
    .maybeSingle();
}
