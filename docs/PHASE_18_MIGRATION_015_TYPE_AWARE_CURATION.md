# Phase 18 — Migration 015 Type-aware Curation Gate

## Objective

Make the publication timing requirement match the Place type:

- Accommodation requires source-backed `check_in_time` and `check_out_time` in `accommodation_details`.
- Restaurant, cafe, attraction, and activity continue to require at least one `place_hours` row.

This prevents Admins from inventing “open 24 hours” for overnight accommodations merely to pass the publication gate.

## Database changes

1. Adds the security-definer RPC `admin_upsert_accommodation_details(uuid, jsonb)`.
2. Limits that RPC to authenticated GepPao Admins and unclaimed accommodation Places.
3. Replaces `moderate_place` with a type-aware timing check.
4. Keeps every other quality requirement from Migration 013 unchanged.

## Application changes

- Admin Curation displays Accommodation Type, Room Count, Maximum Guests, Check-in, and Check-out.
- Check-in and Check-out must be supplied as a pair.
- Data Quality uses check-in/out for accommodations and opening hours for every other Place type.

## Security

- Non-Admins cannot execute the new RPC.
- The RPC cannot edit Business-owned Places.
- The RPC cannot edit a non-accommodation Place.
- Publication remains available only through `moderate_place`, with audit logging unchanged.

## Production impact

- Additive RPC plus a replacement of the existing moderation function.
- Does not update, publish, archive, or delete any Place.
- Pending accommodations remain pending until Admin curation is complete.

## Run order

1. Run `supabase/migrations/015_phase_18_type_aware_curation_gate.sql`.
2. Run `supabase/seed/phase_18_migration_015_verify.sql`.
3. Confirm all five checks return `PASS` before testing the Admin UI.

## Rollback strategy

If application QA fails, do not publish accommodation records. The application branch can be reverted while the additive Admin RPC remains unused. If database rollback is required, restore the Migration 013 version of `moderate_place` and revoke/drop `admin_upsert_accommodation_details`; no Place data needs to be deleted.
