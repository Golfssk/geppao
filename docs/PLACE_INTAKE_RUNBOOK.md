# Source-backed Place intake

## Scope and boundaries

Pilot: Pak Chong–Khao Yai; restaurant, cafe, accommodation (including Pool villa), attraction and activity. Supabase remains the app source of truth. This is an app intake workflow, not a Notion Worker sync and not a Google Maps scraper.

Only owner-authorized submissions, licensed datasets and Gebpao field research are accepted. A public webpage or a checked checkbox is not permission by itself. Do not enter passwords, OTPs, API keys, guest/customer PII or payment information. The SQL/API reject unsupported fields including images, ratings and reviews. A Google Place ID may be retained as an external identity, not as a license to copy Google's business content. Keep Google's application use restrictions separate from the ownership of your dataset.

## Workflow

1. Deploy reviewed migrations before the application release. Visit `/admin/imports` as an existing Gebpao Admin.
2. Submit a single bounded JSON object with a stable `import_key`, `payload`, and `source`. Stage does not create or publish a Place. Changing data under the same import key fails; a new import key represents a new submission/version.
3. Check possible duplicates: Google Place ID across destinations; normalized name/phone in the destination; same-type coordinates within 100 metres. These are suggestions, not proof of identity.
4. Link to an existing reviewed suggestion without overwriting any fields; or create a new Draft when none match. For genuinely distinct co-located businesses, review ALL suggested IDs and record a reason. SQL rechecks under a transaction lock, so changed matches require a new review. An external identity cannot be overridden by a distinct-venue note.
5. New Places are `draft` / `unverified`, with price status unknown and nullable amenities. Never interpret NULL as false/free. Import is transactional and retry-safe. A linked submission is not evidence that existing field values came from that submission.
6. Use Admin curation to fill confirmed timing, prices (with units) and other missing data. Upload rights-cleared media separately, approve it, then moderate the Place. No batch auto-publish.

## Input contract

Required payload: `destination_slug`, `place_type`, `name`, `address`.
Optional: `description`, paired `latitude`/`longitude`, `phone`, `line_id`, `email`, `website_url`, `facebook_url`, `instagram_url`, `booking_url`, `google_place_id`, `secondary_types`.
Accommodation only: `accommodation_type` (e.g. `pool_villa`), `pool_type` (`none` / `shared` / `private` / null), `bedroom_count`, `bathroom_count`, `maximum_guests`, `room_count`, paired `check_in_time`/`check_out_time` (HH:mm).

Required source: `source_kind`, `rights_basis`, `rights_confirmed: true`, non-empty `permission_evidence`, past/present `checked_at` (ISO timestamp).
Pairs: `owner_submission` → `owner_permission`; `licensed_dataset` → `licensed`; `field_research` → `geppao_collected`.
Optional source: public `source_url`, future `rights_expires_at`. Permission expiry is rechecked on acceptance.

Do not attach raw HTML, image bytes, photo URLs, review dumps or an unbounded provider response. Source and field evidence are Admin-only, not a public contact database export. Evidence is historical; later edits require re-verification, not silent rewriting of old evidence. Retention/takedown processing and scheduled freshness reminders are not automated in this release.

## Security behavior

- Owners cannot insert/update approved publication/verification state or approval actor/time; RLS applies before triggers.
- Any owner update invalidates old verification. Published Place edits return to Draft. Child media/hours/prices/details changes also return the parent to Draft.
- Owners cannot approve images. Replacing URL/rights evidence revokes approval. Approved Storage folders cannot be overwritten/deleted by owners until Admin revokes approval; new uploads remain possible.
- Admin publication checks complete data plus an approved, unexpired cover linked to a Place Storage object. Admin media approval API also checks the configured project's media origin.
- These are metadata/API guardrails. Existing storage buckets are public: possession of an unapproved file URL can still expose that file. Moving to private buckets/signed URLs is a separate storage migration, not claimed here.
- Event state/media permissions are guarded too; the full Place publication gate is not asserted as an Event content-quality gate.

## Pilot acceptance

First run synthetic fixtures only in local isolated Postgres/PGlite. Then obtain a small real rights-cleared sample covering the requested categories. Stage each, verify duplicate handling, accept Drafts, compare stored values to evidence, and check they remain absent from anonymous public Search/Planner. Record Admin approvals separately. Do not claim pilot coverage or data completeness from a fixture.

This change does not implement Google rating/Bayesian ranking, real-time prices/room inventory, automated scraping, or full-area business coverage. Secondary categories are stored but unified Search/Planner secondary-category filtering is not added in this release.
