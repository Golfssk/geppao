# Place intake verification

Local run: 2026-10-15, repository baseline b5dd1b301493d7bb57f15632247d89faf9382344.

`npm run check` completed successfully:

- Migration manifest: 30 ordered migrations; historical files unchanged.
- Stay regression: 37 passed.
- Host regression: 4 passed.
- Intake/security: 33 passed.
- Total: 74 passed, zero failed.
- TypeScript typecheck and Next.js production build: passed.

## Intake coverage

Direct owner insert/update cannot self-publish/self-verify or forge media approval. Admin publication requires complete data and an approved/unexpired cover linked to storage. Owner profile and child-data edits invalidate old verification. Storage RLS tests prevent overwrite/delete in approved folders and allow a fresh upload.

Intake validates rights and rejects raw photo/review/rating fields. Tests cover idempotent staging/acceptance, normalized name/phone and nearby matches, explicit distinct-venue review, external-ID conflicts with atomic rollback, no overwrite on linking, expiry recheck, source evidence, Pool fields and legacy RPC preservation.

Synthetic local pilot accepts restaurant, cafe, accommodation, attraction and activity as Draft/unverified. Anonymous RLS reads return none of those pilot rows. No real business was invented or inserted into a hosted database.

## Not yet verified

Hosted Supabase Auth/Storage API behavior, isolated hosted staging apply, actual source-rights-cleared pilot, production migration/deployment and browser checks under real Admin/owner identities remain release gates. PGlite uses auth/storage test doubles and omits only the pgcrypto extension declaration. CI Supabase reset/lint is a separate required check, not inferred from this local result.
