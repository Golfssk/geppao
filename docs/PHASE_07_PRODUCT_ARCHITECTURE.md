# GepPao Phase 7 — Product Architecture

Status: Approved baseline

## Product boundary
GepPao is a Local Trip Intelligence Platform for building usable whole trips. Pilot destination: Pak Chong–Khao Yai.

## MVP entities
- Place types: Accommodation, Restaurant, Cafe, Attraction, Activity
- Event is separate because it is time-bound.
- Business is separate from Place; one Business may manage multiple Places and Events.
- Local Experience uses Activity + tags in MVP; Hidden Gem is an editorial tag.
- Queryable supporting data: destinations/zones, hours, special hours, structured prices, images, tags, local relationships, provenance and freshness.

## Planner principles
1. Every recommendation references a stored Place or Event ID.
2. Hard constraints are filtered before preference ranking.
3. Reasons must derive from stored data; insufficient data must be reported, never invented.
4. Search, Detail and Planner use the same Local Data Foundation.
5. Publication status and verification status are separate.

## MVP exclusions
Full booking/payment, real-time room inventory, social feed, multi-destination trips, AI-created local facts and advanced dynamic pricing.

## Exit criteria
Entity boundaries, MVP types, Planner requirements, constraints, user flows and legacy Listing compatibility are approved. No production data is deleted during Phase 8.