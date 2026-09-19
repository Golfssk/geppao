# Phase 18 — Batch 002 Source-Backed Intake

## Objective

Move the 15 held candidates from Batch 001 into the private Admin curation queue without pretending they are planner-ready or publishable.

## Why this batch is safe

- Every proposed row has a retained government, operator, or institutional source.
- The import writes only source-supported fields.
- Missing coordinates, current hours, price, images, description, duration, and accessibility are left null rather than estimated.
- Every row starts `pending / pending`, so public Search, Explore, Planner, shared trips, and public APIs cannot read it.
- No Event is created from a recurring offering.

## Source quality bands

| Band | Candidates | Handling |
| --- | --- | --- |
| Government coordinate source | Steak In, Kua Kampan, Klua Jan Pha, KHRUA BINLA, Coffee Terrace, Lookkai | Use the recorded name and coordinates. Do not infer current hours. |
| Direct operator source | GranMonte, Papillon, Khao Yai Art Tree Café, Khao Yai Art Tree Restaurant, Khao Yai National Park | Use only the current address/hours stated by the direct source. |
| Institutional editorial lead, dated 2020 | BU•CO•LIC, Rabbit Café, Klang Pana Roses Garden & Café, Campfire Café | Create source-backed pending intake only. Do not copy opening hours into `place_hours` until refreshed by the operator. |

## Quality queue after import

Each Batch 002 record appears in Admin Data Quality as incomplete. The remaining editorial work is intentionally visible:

1. Verify the identity and map pin against a current direct operator source.
2. Add current operating hours or schedules only after direct confirmation.
3. Obtain a permitted cover image.
4. Add a curator-reviewed description and recommended duration.
5. Add prices only when each price value, unit, and validity are established.
6. Admin moderator decides verification and publication separately.

## Non-negotiable outcome

Batch 002 increases the private curation backlog, **not** public coverage. There remains no approval or publication transition in the SQL.
