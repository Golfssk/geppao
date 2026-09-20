# Phase 18 — Batch 007 Attraction Intake

**Purpose:** add three direct-source-backed Pak Chong–Khao Yai attractions/activities as private curation records.

**Checked:** 2026-09-19 (Asia/Bangkok)

## Intake decisions

| Place | Type | Direct source facts imported | Explicitly not imported |
| --- | --- | --- | --- |
| Khao Yai Art Museum | attraction | Address and daily 09:00–17:00 hours from the museum’s website. | Numeric coordinates, structured price, image, description, recommended duration. |
| Khao Yai Speedkart | activity | Official operator post confirms daily 09:00–18:30 and identifies the Speedkart/ATV activity. | Address, numeric coordinates, structured price, image, description, recommended duration. |
| Primo Piazza Khao Yai | attraction | Official Facebook identity and contact number. | Hours — public official-page snippets conflict; address, coordinates, price, image, description, recommended duration. |

## Sources

- Khao Yai Art Museum: https://www.khaoyai-artmuseum.com/
- Khao Yai Speedkart: https://www.facebook.com/Khaoyaispeedkart/posts/come-visit-our-new-atv-and-track-layout-%EF%B8%8Fat-khao-yai-speedkart%EF%B8%8F-open-everyday-90/1645035976956685/
- Primo Piazza Khao Yai: https://www.facebook.com/PrimoPiazzaPage

## Safety decisions

- These are `pending` / `pending` records. They are not public and cannot enter Planner V2.
- Primo Piazza has **no `place_hours` rows**. Conflicting official-page snippets must be resolved before hours are treated as planner facts.
- No price is created from travel directory or third-party values.
- No coordinates are inferred from a map pin, an address, or a hotel/travel listing.

## Run order

1. Run `supabase/seed/phase_18_batch_007_attraction_intake.sql`.
2. Confirm `Success`.
3. Run `supabase/seed/phase_18_batch_007_verify.sql` and share the results.
