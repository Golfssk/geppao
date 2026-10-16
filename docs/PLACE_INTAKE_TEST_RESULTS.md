# Place intake verification

Local run: 2026-10-15, repository baseline b5dd1b301493d7bb57f15632247d89faf9382344.

`npm run check` completed successfully:

- Migration manifest: 30 ordered migrations; historical files unchanged.
- Stay regression: 37 passed.
- Host regression: 4 passed.
- Intake/security/API/component regressions: 67 passed.
- Total: 108 passed, zero failed.
- TypeScript typecheck and Next.js production build: passed.

## Intake coverage

Direct owner insert/update cannot self-publish/self-verify or forge media approval. Admin publication requires complete data and an approved/unexpired cover linked to storage. Owner profile and child-data edits invalidate old verification. Storage RLS tests prevent overwrite/delete in approved folders and allow a fresh upload.

Intake validates rights and rejects raw photo/review/rating fields. Tests cover idempotent staging/acceptance, normalized name/phone and nearby matches, explicit distinct-venue review, external-ID conflicts with atomic rollback, no overwrite on linking, expiry recheck, source evidence, Pool fields and legacy RPC preservation.

Synthetic local pilot accepts restaurant, cafe, accommodation, attraction and activity as Draft/unverified. Anonymous RLS reads return none of those pilot rows. No real business was invented or inserted into a hosted database.

## Not yet verified

Hosted Supabase Auth/Storage API behavior, isolated hosted staging apply, actual source-rights-cleared pilot, production migration/deployment and browser checks under real Admin/owner identities remain release gates. PGlite uses auth/storage test doubles and omits only the pgcrypto extension declaration. CI Supabase reset/lint is a separate required check, not inferred from this local result.

## Follow-up Admin defects and management REA

Both confirmed PR review defects are fixed. The 34 added regressions exercise the actual route/page/component source through Next SWC and controlled auth/database doubles (not handwritten copies of the route logic):

- The queue shared request contract reaches the acceptance RPC for new and existing Places with JSON null. Omitted/blank reasons normalize to null. Invalid reason types/IDs/payloads reject before RPC; distinct overrides still require justification; SQL duplicate conflicts still return 409.
- Anonymous/non-Admin users are denied before import DB calls and before the curation read.
- Admin can load unclaimed and business-owned Places. Missing data produces 404; DB errors remain errors.
- React server rendering verifies all four owned-content fieldsets are disabled, while media approval remains enabled; owner-file deletion is hidden and supported Admin-upload deletion remains available.
- Existing curation/hours/prices server endpoints still refuse owned-place content mutation, even as Admin. The new read access does not expand those write permissions.

These source-level tests and existing PGlite actor/RLS tests do not substitute for hosted Auth/Storage/browser validation. No new migrations were needed for the two fixes.

Official Agoda Partner Portal and Airbnb Hosting documentation was reviewed for the confirmed management-system target. REA 6.4.0 static analysis covered 34 Gebpao Admin source files with zero parse failures; see `ADMIN_HOST_REA_SCOPE.md` for evidence and limitations. No authenticated third-party backend was inspected.
