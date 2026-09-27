-- Cover foreign-key columns used by joins and referential actions.
-- Additive only; no rows or constraints are changed.
begin;

create index if not exists event_images_approved_by_idx
  on public.event_images(approved_by) where approved_by is not null;
create index if not exists event_moderation_log_event_id_idx
  on public.event_moderation_log(event_id);
create index if not exists event_schedules_event_id_idx
  on public.event_schedules(event_id);
create index if not exists events_business_id_idx
  on public.events(business_id) where business_id is not null;
create index if not exists events_place_id_idx
  on public.events(place_id) where place_id is not null;
create index if not exists place_images_approved_by_idx
  on public.place_images(approved_by) where approved_by is not null;
create index if not exists place_moderation_log_place_id_idx
  on public.place_moderation_log(place_id);
create index if not exists place_relationships_from_place_id_idx
  on public.place_relationships(from_place_id);
create index if not exists place_relationships_to_place_id_idx
  on public.place_relationships(to_place_id);
create index if not exists place_sources_place_id_idx
  on public.place_sources(place_id);
create index if not exists place_tags_tag_id_idx
  on public.place_tags(tag_id);
create index if not exists price_items_event_id_idx
  on public.price_items(event_id) where event_id is not null;
create index if not exists product_analytics_actor_user_id_idx
  on public.product_analytics_events(actor_user_id) where actor_user_id is not null;
create index if not exists product_analytics_event_id_idx
  on public.product_analytics_events(event_id) where event_id is not null;
create index if not exists route_segments_to_item_day_idx
  on public.route_segments(trip_day_id,to_item_id);
create index if not exists trip_items_event_id_idx
  on public.trip_items(event_id) where event_id is not null;
create index if not exists trip_items_place_id_idx
  on public.trip_items(place_id) where place_id is not null;
create index if not exists trips_destination_id_idx
  on public.trips(destination_id) where destination_id is not null;

commit;
