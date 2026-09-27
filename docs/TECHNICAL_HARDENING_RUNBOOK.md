# GepPao technical hardening runbook

## Scope

This runbook is the release-independent technical baseline. Pilot venue count, owner recruitment, media acquisition, and final legal approval are intentionally not technical blockers for this track.

## Reproducible application build

- Node is pinned by `.nvmrc`.
- Runtime and development packages use exact versions.
- `package-lock.json` is committed.
- CI uses `npm ci`, never a floating `npm install`.
- Run `npm run check` before merging. It verifies migrations, TypeScript, and a production build.

## Immutable migration chain

Repository migrations are ordered under `supabase/migrations` and protected by `manifest.sha256`.

Rules:

1. Never edit a migration that has reached any shared environment.
2. Add the next numbered migration for every schema change.
3. After adding a migration, run `npm run write:migration-manifest` and review the manifest diff.
4. CI fails on sequence gaps, checksum changes, unsafe `SECURITY DEFINER` declarations, or missing explicit privilege revocation.
5. Dashboard schema exports are evidence only; they must not be inserted into the ordered chain.

## Clean-environment verification

Run in a disposable Supabase project or local Supabase stack, never against Production:

```bash
npm ci
npm run check
supabase start
supabase db reset
supabase db lint --level warning
```

Then execute:

- `supabase/verification/012_trip_intelligence_foundation_check.sql`
- `supabase/verification/production_security_baseline.sql`

A clean build is accepted only when all migrations apply in sequence and the verification queries return no unexpected privileged RPCs or missing foreign-key indexes.

## Production reconciliation

1. Capture `supabase migration list` for the linked Production project.
2. Compare live migration versions with repository files; do not infer that missing history means a missing schema object.
3. Compare live objects and constraints with the final schema produced by a clean reset.
4. If an early migration was applied manually, record it as an adopted baseline rather than replaying destructive DDL.
5. Back up Production before any history repair.
6. Apply only additive corrective migrations after a reviewed dry run.

## Runtime security matrix

Retest these actors after every RLS or privileged-RPC change:

- Anonymous
- Traveler
- Owner A
- Owner B
- Admin
- Trip owner
- Trip editor
- Trip viewer
- Denied user

Required invariants:

- Anonymous users can read only published public records and approved media.
- Owners cannot read or mutate another owner's private records or import provenance.
- Travelers cannot use Admin endpoints or mutate another user's trip.
- `get_shared_trip` requires an exact token and returns read-only, redacted data.
- `track_product_event` accepts only allowlisted event names and bounded metadata.
- Every privileged RPC fixes `search_path`, revokes default PUBLIC execution, and performs an internal authorization check.

## Recovery baseline

Before schema work:

1. Create a database backup or confirm a current managed backup.
2. Record the deployed commit SHA and migration list.
3. Prepare a forward corrective migration; do not roll back by editing history.
4. For application rollback, redeploy the last known-good commit.
5. For data recovery, restore into a separate project first and validate before switching traffic.
