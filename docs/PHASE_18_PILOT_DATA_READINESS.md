# Phase 18 — Pilot Data Readiness

## Objective
Prepare enough verified, fresh, planner-ready local data for the Pak Chong–Khao Yai pilot so GepPao can generate a useful whole-trip plan beyond accommodation-only results.

## Production baseline — 2026-09-19

Source: public production health and published APIs after Phase 17 deployment.

- Published Places: 9
- Published Events: 0
- Published Place types: 9 accommodation records
- Restaurants: 0 confirmed published records
- Cafes: 0 confirmed published records
- Attractions: 0 confirmed published records
- Activities: 0 confirmed published records
- Events: 0 published records
- Published prices: present, but currently legacy accommodation prices and marked estimates
- Published coordinates: must be audited per record before route coverage is considered complete
- Published images: coverage is incomplete
- Verification: most migrated records remain `unverified`

## Scope

### In scope

- Data coverage audit by Place type
- Data completeness and freshness queue
- Source and last-verified evidence
- Minimum quality gate before publication
- Seed/curation workflow for restaurants, cafes, attractions, activities, and seasonal Events
- Planner coverage metrics
- Open-now and date-aware data readiness

### Out of scope

- Booking or payment
- Sponsored ranking
- Paid map APIs
- Destination expansion
- AI-generated Local Data
- Publishing records without a source and verification decision

## Minimum Published quality

Every published Place/Event must have, where applicable:

- Name and type
- Useful description
- Address
- Coordinates
- Cover image
- Opening hours or Event schedule
- Structured price or an explicit free/missing-price decision
- Recommended duration for Planner use
- Source URL or source note
- Last verified date
- Correct Publication and Verification statuses

## Data safety rules

- No synthetic businesses, places, events, prices, hours, coordinates, or images.
- Every curated record must retain its source and verification decision.
- Missing data remains visible as a quality gap; it is not filled with a guess.
- Admin approval is required before publication.
- Legacy accommodation records remain available until replacement coverage is verified.

## Next audit outputs

1. Coverage matrix by Place type.
2. Completeness score by published record.
3. Records missing coordinates, hours, price, image, source, or verification.
4. Curation backlog ordered by pilot value and data risk.
5. Acceptance criteria for the first non-accommodation records.

## Current status

```text
Phase 17: Completed and deployed
Phase 18: Current-state audit / Proposed
Supabase migration: Not required for the first audit
Next gate: approve data contract and curation workflow before adding or publishing pilot data
```
