# Phase 18 — Batch 001 Import Decision Notes

This note governs the pending-place seed script:

- Script: `supabase/seed/phase_18_batch_001_pending_places.sql`
- Scope: five source-audited candidates only, all created as unclaimed `pending` Places with `pending` verification.
- It does not publish, add images, invent descriptions, or change any existing record.
- The script aborts if the destination is missing or any candidate name/slug is already present.

## Price decision

The PB Valley Winery Tour page displays adult/child rates **valid only through 2025-10-31**. The research date is 2026-09-19, so the rate is stale. The seed intentionally inserts **no `price_items`** for the tour or any other candidate. [^https://www.pbvalley.com/wine-tour/]

## Post-import status

After manual execution, the five records remain in Admin review. They must gain the remaining Phase 18 quality fields and complete moderation before any publication transition.
