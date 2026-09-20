# Phase 18 — Batch 004 Activity Intake

## Scope

Two current operator-backed activity candidates are ready for private, pending curation intake:

1. `Khao Yai Kayak Nature Trips & ATV`
2. `ATV เขาใหญ่ กม.9`

Neither is published or planner-available after import.

## Evidence decisions

### Khao Yai Kayak Nature Trips & ATV

The operator’s 2025/2026 Facebook posts identify kayaking and ATV activities, daily operation, a durian-garden location behind Wat Ko Kaew in Mu Si, staff/life jackets, booking contact, and a current map reference. The record intentionally omits hours, coordinates, duration, age/safety rules, and price because those values are not established enough for planner use.

### ATV เขาใหญ่ กม.9

The official Facebook identifies daily 09:00–20:00 operation, booking contact, and an operator-provided map reference. The direct map result identifies the Nong Nam Daeng location. The record intentionally omits price, duration, minimum age, and other safety rules pending direct evidence.

## Natural Spring exclusion

Baan Tha Chang Natural Spring is **not** imported in this batch. Its current closure must remain a hard constraint; see `PHASE_18_ACTIVITY_STATUS_RESEARCH.md`.

## Safety

- Unclaimed records use `business_id = NULL`.
- Imported records start `pending / pending`.
- No price, image, or made-up description is inserted.
- Missing activity safety information remains visible to Admin Curation rather than becoming a Planner assumption.
