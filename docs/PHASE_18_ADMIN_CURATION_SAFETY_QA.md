# Phase 18 — Admin Curation Safety QA

Run these scenarios in the Phase 18 preview or production environment with a confirmed Admin account. Use only test/pending data and only facts supported by a source.

## 1. Access control

1. Sign in as a non-Admin account.
2. Confirm the `Admin` navigation action is absent.
3. Open `/admin/places/<pending-place-id>/curate` directly.
4. Confirm redirect/denial; no update is possible.
5. Sign in as an Admin account.
6. Confirm the `Admin` navigation action is visible and the curation route opens for an unclaimed pending Place.

## 2. Unknown opening hours must stay unknown

1. Open a pending Place with no `place_hours` rows.
2. Confirm every day displays **ยังไม่มีข้อมูลที่ยืนยัน** and the time inputs are not prefilled.
3. Do not select `มีข้อมูล`; do not save hours.
4. Reload and confirm the Place still has zero hour rows.
5. Select `มีข้อมูล` for one source-confirmed day only, enter the source-confirmed range, and save.
6. Confirm exactly that day is saved. Other days must remain absent, not marked closed.

## 3. Closed and overnight handling

1. For a source-confirmed closure, select `มีข้อมูล` and `ปิด` for that day; save and reload.
2. Confirm the closed state persists with no invented time range.
3. For a source-confirmed overnight range, select `มีข้อมูล`, enter the range, select `ข้ามวัน`, save and reload.
4. Confirm the flag persists.

## 4. Price decision consistency

For a pending Place without a source-backed price item:

1. Set the Price Decision to `missing` (or `free` / `not_applicable` only when supported), add factual context if available, and save the profile.
2. Confirm Data Quality does **not** list `ราคา / Price decision` as missing.
3. Set the decision back to `unknown`; confirm Data Quality lists it as missing again.
4. For `available`, add at least one structured price item before attempting publication.

## 5. Publication quality gate

1. Attempt Admin approval with intentionally missing description, coordinates, duration, cover image, or hours.
2. Confirm publication is rejected and the returned error identifies missing requirements.
3. Complete every required field with a supported fact, source-backed price decision, source, and a rights-safe cover image.
4. Approve.
5. Confirm `publication_status = published`, `verification_status = verified`, `last_verified_at` is set, and a moderation-log row exists.
6. Confirm the newly published Place appears in public search/Planner only after approval.

## 6. Regression checks

- Business owner cannot reach Admin Curation or publish independently.
- Admin curation cannot alter a Place owned by another Business through the unclaimed-Place route.
- Price decision and quality donut use the same policy as `moderate_place`.
- Refreshing the page retains saved data and never generates a default hour range.
