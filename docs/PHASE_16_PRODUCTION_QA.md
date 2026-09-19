# Phase 16 — Production Stabilization

## Automated checks
- `npm run typecheck`
- `npm run build`
- `GET /api/health` must return HTTP 200 and `status: ok`

## Public regression
- `/`, `/search`, `/explore`, `/events`, `/planner`
- Draft/Pending/Rejected Place and Event records must never appear publicly
- Search and Planner recommendations must reference stored Published IDs

## Authentication and authorization
- Owner can edit owned Business data
- Non-owner cannot update Place/Event/media
- Business cannot publish directly
- Admin can moderate Place/Event and rejection requires a note
- Anonymous users cannot read private Trips
- Shared Trip tokens expose read-only data without owner identity

## Trip regression
- Create one-day and multi-day Trips
- Save Planner result
- Add/remove/reorder/lock Trip Items
- Budget sum remains consistent
- Share link works in an incognito session
- Google Maps single-stop and multi-stop links open correctly

## Data quality
- Admin completeness dashboard loads
- Published records have coordinates or a usable address
- Hours, prices, cover image, source, and last verification are visible to curators

## Release gate
Do not add routing-provider billing or monetization until this checklist passes on production. Record failures with URL, account role, action, and exact error text.
