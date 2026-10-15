export type StayItem = {
  id: string; slug: string; name: string; description: string | null; address: string | null;
  destination_name: string | null; verification_status: string; last_verified_at: string | null;
  pet_friendly: boolean | null; parking_available: boolean | null; accessibility_supported: boolean | null;
  maximum_guests: number | null; check_in_time: string | null; check_out_time: string | null;
  image_url: string | null; image_alt: string | null; price: number | null; price_max: number | null;
  is_estimate: boolean | null;
};
export type StayResult = {items: StayItem[]; total: number; page: number; pageSize: number};
export type StayDestination = {slug: string; name: string};
