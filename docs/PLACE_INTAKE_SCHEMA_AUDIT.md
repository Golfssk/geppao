# Place intake schema reconciliation

Read-only inspection: 2026-10-15. Connected project: `ndpwapelblkwqkbolyim` (`supabase-red-forest`). Repository baseline: `b5dd1b301493d7bb57f15632247d89faf9382344`.

## Observed, not inferred from migration names

- Live Place-centric schema exists: Places, Businesses, destinations, type details, images, hours, price items, source records and moderation.
- Image-rights columns/checks/public-read policy from 022 and selected FK indexes from 023 exist, although the migration history does not list those names. Do NOT replay historical migrations solely because a history entry is absent.
- `search_public_stays(...)` from 028 is absent. This is a separate deployment prerequisite for the existing stays route; do not call the live route ready.
- Prerequisite columns checked for 029/030 are present; `is_geppao_admin()`, `is_business_editor(uuid)` and `storage.foldername(text)` exist.
- No non-internal triggers were found on Places, Events or their image tables. New intake candidates table is absent.
- Business row policies and broad column grants permit direct editorial-state/media-approval writes. Existing UI restrictions alone do not close that boundary.
- Storage upload/update/delete policies in historical 007/008 use an unqualified `name` inside Place/Event subqueries; tests exposed binding to the inner Place/Event name. 029 qualifies `objects.name` without editing historical files.
- Admin SELECT for unpublished type details is absent from the repository baseline; 030 adds read-only Admin access.

## Prepared reconciliation, not a live apply

- 029 adds guarded editorial/media state, parent invalidation on business child edits, publication cover checks and restrictive storage overwrite/delete policies. No existing rows are rewritten.
- 030 adds intake candidates, external ID links, field provenance, secondary types, contact columns and Pool villa details. It preserves legacy listings/hosts and legacy RPC signatures for accommodation editing.
- Historical 001-028 files are unchanged. New migration checksums are appended to the existing manifest.
- Run `supabase/verification/place_intake_preflight.sql` on the actual deployment target and compare policies/functions/constraints, not only columns. This is a targeted intake reconciliation, not an exhaustive attestation of every live schema object.
- Fresh environments run the ordered chain; existing environments require reviewed delta application. Do not deploy public field-select changes before 030 exists; do not silently run a full reset on a live database.

## Release gates

1. Full `npm run check`, including intake RLS tests and existing stays/host regressions.
2. CI local Supabase reset/lint using the ordered migration chain. PGlite tests are supplementary, not proof of hosted Supabase behavior.
3. Backup/PITR and an isolated staging target, then apply reviewed deltas and verify authenticated Admin/owner/non-owner/anonymous requests.
4. Test actual Storage API overwrite/delete with approved owner media; test Admin approval of owner submissions.
5. Approve rollout explicitly, migrate target before deploying app, then run postflight reads. A PR is not a production deploy.

No real source dataset or owner/licensor evidence was supplied in this task. Synthetic fixtures stay only in isolated tests and must never be seeded into the application database.
