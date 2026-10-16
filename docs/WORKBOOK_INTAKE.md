# Excel → live Gebpao places

## Current workflow

The user explicitly asked to use their supplied workbook on the real site, not just store a private archive. The source archive remains intact, but a separate explicit Admin publication action now converts its factual fields into published Places, visible in unified `/search`, `/places/[slug]`, and `/admin/places?status=all`.

`/admin/imports` now opens a non-technical workbook dashboard with live public-link counts, linked duplicates, pending records, file/category filters, and direct “View on website” / “Edit place” links. The old JSON staging queue remains under `/admin/imports/advanced`, not the default entry point. Uploaded files are already in the database; this is not a new generic XLSX upload endpoint.

## Source integrity and actual publication

The original 195,149-byte Pakchong_Places_5Tabs_Clean.xlsx and all 690 rows/eleven raw cells are preserved privately. SHA-256: 2dfc32f7d8df43d55cdb66905767a6e0b29adcf78a7ee5c091c9ba4950731447. All five source tabs remain intact. No file contents, raw records or upload SQL are committed to Git.

The authorized publication created 668 new Places and linked 22 source rows rather than creating duplicates (21 matched pre-existing Places, one matched a record from the same workbook). No source rows were held by this run. A source row is not necessarily a distinct business: do not report 690 newly created businesses. Duplicate matches do not overwrite existing content or approve existing drafts. Duplicate detection is conservative and not a proof that no further duplicates exist.

Names, coordinates, addresses where supplied, Google Maps handoff links, source category, source rating/review-count snapshots, source price text and accommodation-detail text are usable on public directory pages. Categories prefer source business tags over the search-tab name, so a cafe in a villa search is not called a villa; campsites are accommodation. Search includes source category/tab keywords. No external API call was made.

## Directory versus curated

Migration 033 adds `catalog_level` (existing rows default to `curated`) and a provenance-linked `directory` mode for imported basic records. Directory records require an explicit Admin action, a linked ready source, name, coordinates and safe Maps link. They remain unverified; they cannot assert verified status. The existing full curated publication and approved-cover media gates remain intact. Non-Admin callers cannot create or change this exception/provenance. Source images and review text are not copied.

There are no invented photos, contacts, structured opening hours, visit durations, capacity/amenity booleans or booking prices. Source dates may be unknown. Source rating/count are labeled snapshots in the supplied file, NOT live Google data or Gebpao reviews. Price text is not turned into a per-person/night booking quote or planner cost. The workbook rights status remains unconfirmed; no owner permission, photo license, or official Google data license is fabricated. Existing image approvals/expiry rules still apply to media uploaded separately.

The original raw status/hours and service/review snippets remain private in the archive, not automatically parsed as weekly hours or copied into public descriptions. Public facts are a whitelist, not the raw eleven-column JSON. The Planner still requires its own usable time/description facts; publishing a basic directory record does not make it itinerary-ready.

## Access, atomicity, and repeat runs

The original binary and raw source rows retain Admin-only RLS; anonymous access and all direct browser writes to the archive remain denied. Admin-only security-definer RPCs use a fixed search path. The publication API checks session Admin, batch UUID and same origin before the RPC. All application reads/writes use session clients, not a web service-role key.

Publication is transactional, locks the batch and serializes cross-workbook imports. It matches previous source identities/Maps IDs/normalized names, links without rewriting existing content, and holds ambiguous matches or missing identity/coordinates. Deterministic identity slugs and source-row uniqueness support repeat safety. A failed request can be retried without duplicating committed records. Counts reflect current public status; unavailable data is not shown as zero successful imports.

## Verification

Real migration SQL is exercised by new directory regressions: authorization, duplicate/idempotent/cross-workbook linking, ambiguous/missing source holds, proper classification, preserved zero/null, no fake media/review text, anonymous public reads, source privacy, original curated gate, provenance anti-escalation, API origin/UUID guards and real detail rendering. Existing immutable migrations 001–032 remain unchanged. New 033/034 are additive; 034 preserves unified search filtering, pagination, public-only rows and RLS while adding the public source snapshot.

Local test suites passed (236 tests before the final upstream-only destination-test refresh); TypeScript passed and production build passed with a local-only Turbopack root override required by the sandbox node_modules symlink. Production config is unchanged; GitHub CI checks the normal clean install/build. Actual component desktop/mobile ready/pending/error and directory-detail renders were inspected. Hosted anonymous search and raw-source denial were checked separately. Hosted signed-in Admin UI is not claimed as tested without a user session.

No new paid services, Google Billing, paid branch/project, Storage bucket, subscription change, or API charges were introduced.
