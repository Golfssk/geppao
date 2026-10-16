# User-supplied workbook intake

The user designated `Pakchong_Places_5Tabs_Clean.xlsx` as the primary source and explicitly requested uploading it to Gebpao, with no paid services. This is a private source archive, not publication or a claim of Google content ownership.

## Stored upload

- 195,149-byte original XLSX stored intact in `workbook_import_batches.original_file`; PostgreSQL checks size and SHA-256 against the upload. The archive does not use a new Storage bucket, project, branch, paid API or subscription upgrade.
- 690 source rows and all eleven raw columns stored in `workbook_import_rows`, linked to sheet name and original Excel row number. Both raw and parsed values are preserved; dashes remain unknown, not fabricated zeros/booleans. No formulas or embedded images were found in the workbook.
- Sheet counts: restaurants 162, cafes 133, Pool Villa 71, campsites 246, attractions 78. All 690 source Place IDs were unique within this workbook; this is NOT a claim of no overlap with existing Gebpao Places.
- 586 rows have numeric ratings; missing ratings are null, never zero. Ratings/review counts are historical workbook values, not fresh API responses or Gebpao user reviews. No Bayesian score has been calculated by this upload.
- Coordinates and Google Place IDs were parsed from the supplied URLs only; no Google API or live Maps page was called. Sheet membership proposes a category; geographic membership and business classification are unverified. Do not treat a transient `Closed`/`Opens soon` snippet as a permanent closure or structured weekly schedule. The source observation date remains unknown.
- Ready means all expected rows and the source file were uploaded and verified. It does not mean rights confirmed, reviewed, a Place created, or published. No existing Places/Events/images/accommodation fields were overwritten; exact pre/post comparison of the previously captured records passed. Public catalog remains 93 existing published entries at upload time, not 690 newly published entries.

## Access and idempotence

Migration 032 is additive and does not modify existing catalog/publication gates or intake RPCs. Both tables have RLS. Only existing Gebpao Admin sessions can read metadata/source rows. Anonymous users lack table grants; signed-in non-Admins see no rows. Browser roles, including Admin, have no archive write grants, and original binary bytes are not granted to them through REST.

The one-off upload was executed in one transaction, keyed by file SHA-256 and `(batch_id,sheet_name,sheet_row)`. Conflicting source values raise rather than overwrite. Batch readiness requires an exact row-count and source-value check. Original files, data payloads and private audit/QA outputs remain outside Git; no real source dataset is embedded in migrations or tests.

## Admin viewer

`/admin/imports/workbooks`, linked from `/admin/imports`, shows file metadata, selected source tabs, exact row counts and 30-item database pagination. Each row exposes all original cells, with Google links restricted to known HTTPS Google Maps origins. The page authenticates/authorizes before querying and uses a session client/RLS, never a service-role web client. An unavailable database is not shown as a successful empty import.

This viewer is read-only. It does not include a general-purpose XLSX upload endpoint or a publication/rights-approval action. The existing rights-evidenced curation workflow remains required before user-supplied data becomes public. Do not relabel this workbook as owner-approved/licensed or lower the image/publication gate just to make it visible.

## Verification

- 25 new regressions exercise actual schema and source: Admin/non-Admin/anonymous RLS and grants, protected binary/write access, file checksum/shape constraints, preserved zero counts and unknown dates/rights, no automatic Place creation, bounded query/Maps validation, real loader pagination and error handling, auth-before-query and safe source rendering.
- Full local check passed: 188 tests total, 32 immutable migrations, TypeScript and production build. Historical 001–031 unchanged. Fresh Supabase CI must still pass before merge.
- Actual component renders inspected at desktop 1440px and mobile 390px, including ready/empty/error states. Fixed a long-filename mobile overflow and empty-state wording. This is local component visual QA, not a claim of a hosted signed-in Admin browser session.
- Hosted postflight verified original file checksum, all 690 rows, source-sheet counts, Admin-only grants/RLS and preservation of existing catalog records. Hosted real Admin login remains untested in this agent session.
