-- Apply AFTER the 038-compatible application is deployed and verified.
-- Intentional fail-closed cutover. Do not roll back to a raw-DML application afterward.
revoke insert,update,delete on public.trip_items,public.trip_days,public.route_segments from authenticated,anon;
revoke all on function public.arrange_trip_item(uuid,uuid,uuid,uuid,uuid,jsonb),public.move_trip_item(uuid,uuid,uuid,uuid),public.schedule_trip_wishlist(uuid,uuid,uuid),public.refresh_trip_day_summary(uuid) from public,anon,authenticated;
