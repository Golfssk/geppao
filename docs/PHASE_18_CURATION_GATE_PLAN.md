# Phase 18 — Curation Gate Plan

**Status:** In progress

## Why the workflow changes here

The intake pipeline now has substantial source-backed coverage across accommodations, restaurants, cafes, attractions, and activities. More pending rows alone do not make the pilot Planner-ready.

A Place cannot become public or Planner-eligible until the database quality gate accepts it. The gate requires, at minimum:

1. description
2. address
3. numeric coordinates
4. recommended duration
5. cover image
6. opening-hour decision/data
7. source
8. last verified date
9. price decision (`available`, `free`, `missing`, or `not_applicable`)

## Current policy

- Existing pending intake records are not published in bulk.
- No missing field is invented merely to meet a completeness threshold.
- Admin uses the Curation UI to complete facts with source support, upload rights-safe images, set a truthful price decision, and submit the record through moderation.
- Admin approval remains the only publication path; Business users cannot publish.

## Pilot curation order

1. **Accommodation core:** choose places with direct address/contact plus operator booking information.
2. **Dining core:** choose places with complete weekly hours and a direct operator source.
3. **Attraction/activity core:** prioritize active venues with verified schedule, physical coordinates, and safety/booking facts.
4. **Seasonal or closed venues:** retain as pending or archive; never recommend as currently open without a current source.

## Phase 18 checkpoint

Before creating another bulk intake pack, complete Admin curation for an initial cross-category set sufficient for real whole-trip testing. This validates the Curation UI, the database quality gate, and the Planner's published-only behavior — the three remaining Phase 18 dependencies that raw intake cannot replace.
