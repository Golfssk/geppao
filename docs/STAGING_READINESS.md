# Existing free-project rollout and staging inspection

## Owner-authorized existing-target rollout

After the initial staging blocker was explained, the owner requested proceeding on the existing free project. No staging project, paid branch, subscription upgrade, environment change or paid service was created. This is an explicitly accepted exception to the earlier staging gate, not a claim that independent staging now exists.

- Rechecked actual target definitions and confirmed all prerequisite columns; the new search/intake objects were absent.
- Saved affected-table records plus function/policy/trigger definitions and privilege snapshots securely outside Git. This is a targeted recovery snapshot, not a full database, Auth/Storage byte backup or PITR service.
- Applied only reviewed repository deltas 028–031 in one transaction, with lock/statement timeouts, recorded as `reconcile_public_search_and_intake_028_031`. Historical migrations 001–027 were not reset/replayed. No existing rows were rewritten/deleted, no publication status was changed and no fixtures were seeded.
- Exact pre/post JSON comparison (excluding newly added nullable columns) confirmed all original fields unchanged: 187 Places, 6 Events, 189 Place images, 6 Event images and 29 accommodation details.
- Hosted anonymous-role SQL exercised all seven catalog categories; every returned item was published and pages were bounded to 12. Published counts at this inspection: 93 total, including 29 stays, 28 restaurants, 20 cafes, 6 attractions, 4 activities and 6 Events. These are existing records, including demo content; they are not a verified real-business inventory.
- Latest full local `npm run check`: 163 tests passed, zero failed; typecheck, 31 migration checksums and production build passed.
- Security advisor returned warnings for intentionally callable SECURITY DEFINER entrypoints and disabled leaked-password protection, but no RLS-disabled-new-table finding. Function grants alone do not prove missing internal authorization; new intake RPCs retain Admin checks. Do not blindly revoke the anonymous trip-share or analytics RPCs.

### Remaining verification and recovery limits

Preview environment configuration access remains 403; no secrets were retrieved and its database binding was not independently verified from settings. Production deployment/HTTP checks must be reported separately. Real signed-in Admin/owner and Storage API overwrite/delete smoke tests have not been completed; no test accounts or synthetic records were inserted in the hosted project. Existing public buckets are not made private by these migrations.

For an app regression, first revert/roll back the app deploy while preserving additive database objects and newly collected data. A manual, reviewed guard/policy/function recovery script is stored with the private recovery snapshots; it is not automatically executed and does not drop new intake tables/columns. Do not reset or run broad destructive rollback SQL.

---

## Historical read-only staging inspection

## Result

**Blocked for hosted mutation testing.** A successful Vercel Preview build is not proof of an isolated staging database. No hosted records, schema, environment variables, branches, projects or account permissions were changed during this inspection.

## Observed facts

- Supabase project listing exposed one accessible project: `supabase-red-forest`, ref `ndpwapelblkwqkbolyim`, healthy.
- Its branch listing returned only the default `main` branch with the same project ref. No independent staging project/branch was identified through the current connection. This is not a claim about resources hidden by permissions.
- A read-only `pg_proc` / `to_regclass` check found no `search_public_stays`, no `admin_stage_place_import`, no `place_secondary_types` and no `place_import_candidates` in that target. This confirms schema prerequisites are missing; migration filenames/history alone must not be used to replay old SQL blindly.
- Vercel deployment `dpl_Bevwwj5YfeXuJZYoWd1Gx6RjoHmj` was READY for branch `feat/place-intake-security`, commit `76a5ec306eb98bd4039de31b9e3e78f7fd147a39`, with no production target in its response.
- Reading Vercel environment configuration for project `geppao` under `golfssks-projects`, with decryption disabled, returned 403 for the current connection. No Vercel CLI was installed/available for the mapped credential fallback. No environment values or secrets were obtained. The Preview database association therefore remains **unverified**, not assumed separate.

Sources: connected Supabase `list_projects`, `list_branches` and read-only schema query; Vercel `get_deployment` and failed `filter_project_envs`. This records the inspected state, not ongoing monitoring.

## Safe next gates

1. The workspace/project owner confirms an existing **independent** staging Supabase target, or authorizes creating one after reviewing applicable costs. No paid project/branch is created by this change.
2. A Vercel team member with appropriate access confirms Preview's Supabase URL/project ref and that privileged production credentials are not used for Preview. Do not paste API keys, connection strings or passwords into chat. If the connection lacks access, the owner must grant the intended scope or inspect the binding in their own dashboard.
3. Reconcile the chosen target schema, review required migrations against actual definitions, backup/PITR and recovery plan. A fresh empty staging database can replay the ordered chain; the existing target must not be treated as empty. Unified search adds `031_unified_public_search.sql` and depends on the prior schema including 030.
4. Apply only reviewed migrations to staging, then validate real Auth/Storage behavior with Admin, owner and anonymous sessions. Confirm owner editing, no self-publication/media approval, no cross-business writes, media evidence/takedown and public search visibility.
5. Use a small owner-authorized/rights-cleared business sample. Synthetic fixtures stay local and must not be represented as real hosted businesses.
6. Only after staging sign-off, review merge order, target rollout and application deployment. Do not promote a build that selects schema/RPCs not yet installed in its database.

## Local testing meanwhile

The unified-search UI is exercised against a loopback HTTP Supabase test double backed by isolated PGlite fixtures and the real search SQL. Browser QA uses this local target only. This does not establish hosted Auth, Storage or production readiness. The metadata-approved media rules also do not make existing public buckets private.
