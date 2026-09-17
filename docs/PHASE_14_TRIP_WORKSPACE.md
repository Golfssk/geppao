# Phase 14 — Trip Workspace Foundation

## Purpose
Persist whole-trip plans without extending the accommodation-centric `trip_sessions` prototype.

## Model
- `trips`: ownership, dates, budget, preferences, status, optional share token
- `trip_members`: editor/viewer collaboration
- `trip_days`: ordered calendar days
- `trip_items`: ordered Place or Event references

Every trip item references exactly one stored `place_id` or `event_id`; generated recommendations cannot invent Local Data. `is_locked` supports traveler choices that replanning must preserve.

## Security
Owners create/delete trips. Owners and editors modify days/items. Members read. A share token permits read-only sharing while present. Legacy `trip_sessions` remains unchanged until Planner V2 passes regression testing.