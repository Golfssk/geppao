# Public media gate — 2026-09-26

## Policy

Public GepPao pages display a Place/Event image only when all conditions are true:

1. URL is valid HTTPS.
2. URL origin matches `NEXT_PUBLIC_SUPABASE_URL`.
3. Object path is inside the managed `place-images` or `event-images` public bucket.

External URLs—including existing Unsplash/mock assets—are not rendered publicly. Cards show the existing neutral placeholder; detail pages omit the unapproved image.

Owner and Admin management screens still retain access to source records for review, replacement and deletion. The Admin Data Quality score counts a cover only when it passes the same managed-media rule.

## Reason

The current schema has no record-level public approval flag tied to permission evidence. URL provenance alone cannot prove copyright permission. Failing closed prevents third-party placeholders from being treated as approved launch media while preserving the underlying records for curation.

## Future schema

Add explicit media-rights fields or a related evidence table before allowing external licensed media:

- rights holder
- rights basis/license
- permission evidence reference
- approved by/at
- expiry/restrictions
- takedown status
