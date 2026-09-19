# Phase 17 — Route, Schedule, and Budget Intelligence

## Goal
Turn a list of Trip Items into an explainable operational plan without fabricating opening hours, prices, or route data.

## Persisted outputs
- Item duration and incoming travel estimate
- Item validation state: pending, valid, warning, conflict
- Structured validation messages
- Route segments between ordered Trip Items
- Day cost, distance, travel time, validation state, and calculation timestamp

## Provider strategy
Start with transparent Haversine estimates when coordinates exist. Mark them `estimate`. Google Maps URL navigation remains the execution layer. A paid route provider may replace estimates later and must be marked `provider` rather than silently presented as confirmed.

## Validation sequence
1. Resolve ordered Published Place/Event records.
2. Apply special hours before recurring hours.
3. Validate Event schedules and cancellation status.
4. Apply recommended duration.
5. Calculate route segments.
6. Detect overlaps and arrival-after-close conflicts.
7. Calculate prices by unit and traveler/night quantity.
8. Refresh day summaries.

## Safety rules
- Missing data produces a warning, not an invented value.
- Closed dates and impossible Event schedules produce conflicts.
- Locked Trip Items are never removed by recalculation.
- Estimated route and price values remain visibly labeled.
- Route segment endpoints must belong to the same Trip Day.
- Zero distance and zero travel time are valid values for same-location or unavailable-duration estimates; they must not be rejected by the database.

## Database Gate
1. Back up the production database using the project's manual logical snapshot process.
2. Run `supabase/migrations/012_trip_intelligence_foundation.sql` in Supabase SQL Editor.
3. Run `supabase/verification/012_trip_intelligence_foundation_check.sql`.
4. Confirm the expected tables, columns, policies, constraints, and summary function before application code is enabled.

The migration is additive and preserves Legacy tables and existing Trip records. No application Calculation Engine should be merged before the user confirms this gate passed.
