# Phase 18 — Consolidated Accommodation Data Pack 001

**Status:** Reconciled; 14-record remaining import ready
**Checked:** 2026-09-19 (Asia/Bangkok)
**Scope:** 20 direct-operator-source accommodation Places for the Pak Chong–Khao Yai pilot.

## Duplicate preflight resolution

The read-only preflight found six existing Places. They are not conflicting duplicates: each has the same slug, name, type, pending statuses, imported address/phone/coordinates where applicable, and one source row expected from the former unexecuted Batch 008 scope.

| Existing confirmed Place | Decision |
| --- | --- |
| U Khao Yai | Preserve unchanged; do not create another record. |
| Splendid Hotel Khao Yai | Preserve unchanged; do not create another record. |
| Hotel Labaris Khao Yai | Preserve unchanged; do not create another record. |
| Hotel MYS Khao Yai | Preserve unchanged; do not create another record. |
| Kirimaya The Resort | Preserve unchanged; do not create another record. |
| Mövenpick Resort Khao Yai | Preserve unchanged; do not create another record. |

The remaining **14 candidates are missing** and can be imported safely using the reconciled script below.

## Safety contract

- Existing records are not modified.
- The remaining 14 Places are created as unclaimed (`business_id = NULL`), private `pending` / `pending` records.
- The import is one transaction and stops before writing if one of the 14 remaining slugs now exists.
- No room rate, room count, check-in/out time, amenity, cover image, description, recommended duration, or fabricated opening hour is added.
- No `place_hours` rows are created for accommodations.

## Run order

1. Run `supabase/seed/phase_18_consolidated_accommodation_pack_001_remaining.sql`.
2. If it returns `Success`, run `supabase/seed/phase_18_consolidated_accommodation_pack_001_verify.sql`.

Expected successful result: 20 `PASS` rows and summary `place_count = 20`, `status = PASS`.
