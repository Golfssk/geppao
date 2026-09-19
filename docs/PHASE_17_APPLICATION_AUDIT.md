# Phase 17 Application Audit

## Current state

- Trip creation already uses `create_trip_with_days()`.
- Trip Items already reference exactly one `place_id` or `event_id`.
- Planner V2 returns real Place/Event IDs and the save flow persists them.
- Trip Item CRUD supports ordering, schedule timestamps, estimated cost, and locking.
- Phase 17 database foundation is merged and verified in Production.

## Gaps addressed in this branch

- No server-side Trip recalculation endpoint existed.
- Route estimates were not persisted from Trip order.
- Opening hours, special hours, and Event schedules were not validated together.
- Missing prices could be represented as zero by the Planner save path; the engine now keeps missing prices explicit in validation messages and reports partial cost coverage.
- No single response contract existed for day summaries, warnings, conflicts, and route estimates.

## Calculation contract

`POST /api/trips/[id]/recalculate`

- Requires an authenticated Trip Editor or Owner.
- Reads only Published Place/Event records through the existing RLS boundary.
- Preserves Trip Items, including locked items; recalculation only refreshes derived fields and Route Segments.
- Returns per-item validation messages, route estimates, cost coverage, and day summaries.
- Uses Haversine distance with a transparent 35 km/h local driving estimate. It never claims Google Maps travel time.

## Status rules

- `valid`: no validation messages.
- `warning`: missing coordinates, missing schedule timestamps, missing hours, estimated prices, or missing price/quantity data.
- `conflict`: unpublished/missing source, closed Place, unavailable Event schedule, schedule overlap, or arrival after closing.

## Out of scope

- Paid route providers
- Route optimization
- Replanning or deleting Trip Items
- LLM-generated Local Data
- New Supabase schema changes

## Next QA gate

- TypeScript and Production Build must pass.
- Test recalculation as Owner, Editor, Viewer, and unauthenticated user.
- Verify locked items remain unchanged.
- Verify missing coordinates/prices produce warnings rather than invented values.
- Verify Published-only behavior and RLS on Production.
