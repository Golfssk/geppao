# GepPao Phase 8 — Place-Centric Database Migration

## Goal
Add a place-centric foundation without breaking the accommodation website or deleting legacy production data.

## Strategy
1. Keep `hosts`, `listings`, `listing_images`, `leads` and `trip_sessions` intact.
2. Add Businesses, Places, Events, queryable hours/prices and local-intelligence tables.
3. Map each Host to a Business and each Listing to an Accommodation Place.
4. Preserve legacy IDs/slugs and keep current runtime reads on `listings` until verification passes.
5. Move Search, Detail, Host and Planner one flow at a time in later changes.

## Before running
Back up Supabase; run in staging first; confirm the live schema matches the supplied schema; review RLS with anonymous, authenticated owner and non-owner accounts.

## Verification
```sql
select count(*) from public.listings;
select count(*) from public.places where legacy_listing_id is not null;
select count(*) from public.hosts;
select count(*) from public.businesses where legacy_host_id is not null;
select * from public.legacy_listing_place_map order by listing_slug;
```
Place/Listing and Business/Host counts must match. Existing Home, Search, Detail, Host and Planner behavior must remain unchanged.

## Rollout
Schema/types first → run and verify migration → Place repository and curation UI → migrate Search/Detail → collect hours/prices/events → Planner V2. A destructive rollback is intentionally excluded until the target environment is inspected.