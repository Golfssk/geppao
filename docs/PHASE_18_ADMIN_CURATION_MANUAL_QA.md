# Phase 18 — Admin Curation Manual QA

Run these checks in the Phase 18 Preview after Migrations 013 and 014 succeed.

## Access and queue

1. Sign in with an Admin account.
2. Open `/admin`.
3. Confirm the 20 Batch 001/002 Places remain visible as `pending / pending`.
4. Open **จัดการข้อมูล** for an unclaimed Place such as Ribs Mannn.

## Curation workspace

1. Confirm the existing source-backed data is shown and the Place is not published.
2. Save an unchanged profile (or a source-backed correction) and confirm the success message.
3. Confirm the page rejects invalid latitude, longitude, or duration values.
4. Select `missing` as Price Decision with an evidence note and save; this must not create a price row.
5. If an owned, permitted image is available, upload it, set it as cover, and refresh to confirm it persists.
6. Add or change hours only when a direct source supports them, then refresh to confirm persistence.

## Publication guard

1. Return to `/admin`.
2. Attempt **อนุมัติและเผยแพร่** on an intentionally incomplete pending Place.
3. Confirm the action fails with the missing-field list.
4. Confirm the Place remains `pending / pending` and the public APIs do not expose it.

## Security boundaries

1. Open the Curation route signed out: it redirects to login.
2. Open it as a non-Admin: access is denied/redirected.
3. Confirm the curation UI only opens unclaimed Places; it must not become a replacement for Business-owned editing.

## Exit signal

Report the tested Place and each pass/fail result. Do not publish an incomplete Place merely to test the workflow.
