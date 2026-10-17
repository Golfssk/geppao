import {notFound, redirect} from 'next/navigation';
import {createClient} from '@/lib/supabase/server';
import {TripExperience} from '@/components/trips/TripExperience';

export const dynamic = 'force-dynamic';

const priceOf = (items: Array<{amount_min: number | string | null}> | null | undefined) => {
  const value = items?.[0]?.amount_min;
  return value == null ? null : Number(value);
};

export default async function TripPage({params}: {params: Promise<{id: string}>}) {
  const {id} = await params;
  const supabase = await createClient();
  const {data: auth} = await supabase.auth.getUser();
  if (!auth.user) redirect('/host/login?next='+encodeURIComponent('/trips/'+id));

  const [{data: trip}, {data: places}, {data: events}] = await Promise.all([
    supabase
      .from('trips')
      .select('*,trip_days(*,trip_items(*,places(id,name,slug,place_type,address,latitude,longitude,google_maps_url),events(id,name,slug,address,temporary_venue_name,latitude,longitude)))')
      .eq('id', id)
      .order('day_number', {referencedTable: 'trip_days'})
      .maybeSingle(),
    supabase.from('places').select('id,name,place_type,price_items(amount_min)').eq('publication_status', 'published'),
    supabase.from('events').select('id,name,price_items(amount_min)').eq('publication_status', 'published'),
  ]);

  if (!trip) notFound();

  const {data:wishlist,error:wishlistError}=await supabase.from('trip_wishlist').select('id,place_id,event_id,created_at,places(id,name,slug),events(id,name,slug)').eq('trip_id',id).order('created_at');
  const isOwner=trip.owner_user_id===auth.user.id;
  const canEdit=isOwner||Boolean((await supabase.rpc('can_edit_trip',{target_trip_id:id})).data);
  const candidates = [
    ...(places ?? []).map((place: any) => ({
      key: `p-${place.id}`,
      kind: 'place',
      id: place.id,
      name: place.name,
      type: place.place_type,
      cost: priceOf(place.price_items),
    })),
    ...(events ?? []).map((event: any) => ({
      key: `e-${event.id}`,
      kind: 'event',
      id: event.id,
      name: event.name,
      type: 'event',
      cost: priceOf(event.price_items),
    })),
  ];

  return (
    <main className="page">
      <div className="container section trip-workspace-shell">
        <TripExperience trip={trip} candidates={candidates} wishlist={wishlistError?null:wishlist??[]} canEdit={canEdit} isOwner={isOwner} currentUserId={auth.user.id} />
      </div>
    </main>
  );
}
