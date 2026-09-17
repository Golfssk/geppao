# GepPao Current Database Contract

The live Supabase schema is the source of truth. Historical product notes are not executable schema specifications.

## Legacy compatibility
- `hosts`, `listings`, `listing_images`, `leads`, and `trip_sessions` remain available during migration.
- Host status values are `active`, `inactive`, and `pending`.
- Listing image URL is `listing_images.image_url`.
- Listings do not use a `tier` column.
- Leads use `action` and optional contact fields.
- Trip sessions use travel dates, `travelers`, `budget`, `preferences`, and `result`.

## Place-centric model
- Business and Place are separate.
- Place and Event are separate.
- Restaurant and Cafe are distinct Place types sharing Dining details.
- Opening and special hours are queryable records.
- Prices always include a unit.
- Publication and verification are separate states.
- Business users submit Places for review; only Admin moderation publishes them.
- Search, Detail, and Planner will migrate to this shared model incrementally.

## Migration order for a new environment
1. `001_initial.sql`
2. `phase6_listing_content.sql` (storage bucket/policies; columns are idempotent)
3. `002_place_centric_foundation.sql`
4. `003_place_read_policies.sql`
5. `004_business_place_crud_policies.sql`
6. `005_admin_curation.sql`

Never run schema exports copied from dashboards as migrations. Review and run repository migrations in order.
