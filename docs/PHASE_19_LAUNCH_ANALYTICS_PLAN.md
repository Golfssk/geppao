# Phase 19 — Pilot Launch & Optimization

## Objective

Measure whether real users can discover Local Data, create a usable Trip, open navigation, and share the Trip without collecting raw planner/search text or other unnecessary personal data.

## User value

- Traveler friction becomes visible and measurable.
- Planner quality decisions use evidence instead of assumptions.
- Business engagement can be measured per published Place/Event.
- Incidents and missing product behavior can be prioritized.

## In scope

- Privacy-safe first-party product analytics.
- Traveler funnel: Search → Planner → Trip → Navigation → Share.
- Place/Event engagement.
- Admin analytics dashboard.
- Pilot checklist and incident workflow.
- Real pilot sessions and optimization backlog.

## Out of scope

- Advertising profiles.
- Raw search/planner text storage.
- Third-party analytics SDKs.
- Paid analytics services.
- Sponsored ranking or monetization.

## Non-negotiable rules

- Analytics must not make pending Local Data public.
- Actor identity is derived from Supabase Auth; it is never accepted from the client.
- Anonymous events require a random session UUID.
- Shared Trip analytics resolves the Trip by share token without exposing the owner.
- Place/Event references must be published.
- Metadata is allow-listed, bounded, and contains no raw user prompt.
- Only GepPao Admin can read analytics rows and summaries.

## Data contract

Migration 016 introduces `product_analytics_events` plus two RPCs:

- `track_product_event(...)` validates and writes events.
- `get_product_analytics_summary(window_days)` provides Admin-only aggregate metrics.

Tracked events:

- `search`
- `planner_run`
- `planner_recommendation`
- `trip_created`
- `add_to_trip`
- `remove_from_trip`
- `lock_item`
- `unlock_item`
- `trip_recalculated`
- `place_view`
- `google_maps_opened`
- `trip_shared`
- `contact_clicked`
- `event_interest`

## Migration gate

1. Run `supabase/migrations/016_phase_19_product_analytics.sql` in Supabase SQL Editor.
2. Run `supabase/seed/phase_19_migration_016_verify.sql`.
3. Confirm every row is `PASS`.
4. Do not merge analytics application code before this gate passes.

## Application work after migration confirmation

- Add `/api/analytics`.
- Add a client analytics helper with persistent random session UUID.
- Instrument Search, Planner, Trip creation/editing, lock/unlock, recalculation, Google Maps, sharing, Place contact, and Event interest.
- Add `/admin/analytics` with funnel, daily usage, and top Places.
- Add pilot and incident documentation.

## Exit criteria

### Launch-ready

- Migration and RLS pass.
- Instrumentation and Admin dashboard pass CI and manual QA.
- Production health is OK.
- Event writes and Admin-only reads are verified.
- Pilot/incident workflow is documented.

### Completed

- Real pilot users have generated evidence.
- Funnel and Planner quality metrics are reviewed.
- Critical incidents are resolved or explicitly accepted.
- Optimization backlog is based on observed behavior.

Phase 19 must not be marked Completed from implementation alone.
