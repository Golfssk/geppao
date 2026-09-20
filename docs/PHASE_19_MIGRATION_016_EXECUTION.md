# Phase 19 — Migration 016 Execution

## Files

- Migration: `supabase/migrations/016_phase_19_product_analytics.sql`
- Verification: `supabase/seed/phase_19_migration_016_verify.sql`

## Production impact

- Adds a new analytics table and indexes.
- Adds two security-definer RPCs.
- Does not update, delete, publish, or reclassify Local Data.
- Does not change existing Search, Planner, Trip, Business, or Admin behavior until application instrumentation is implemented.

## Run order

1. Copy the complete migration into Supabase SQL Editor and run it once.
2. Copy the complete verification query and run it.
3. Confirm all ten checks return `PASS`.

## Expected verification checks

- `admin_read_policy`
- `admin_summary_grant`
- `analytics_rls_enabled`
- `analytics_summary_function`
- `analytics_table`
- `anonymous_tracking_grant`
- `authenticated_tracking_grant`
- `no_direct_insert_policy`
- `required_constraints`
- `track_product_event_function`

## Result

Pending project-owner execution and confirmation.
