# Technical readiness — current evidence and ordered next gates

## Evidence scope
Read-only inspection of the linked Supabase project and GitHub main at commit `67ca9a2aa98d2ec96edf42627c68d6241c406627`, followed by a scoped local dependency update. This is not a certificate of production readiness, a hosted authenticated-role smoke test, a backup or permission to publish/verify records.

## Completed in this change
- Upgrade Next.js from 16.3.6 to 16.4.2.
- Refresh source-map-js from 1.2.1 to 1.2.2 in the lockfile, including its nested Next/PostCSS dependency path.
- Main-application `npm audit` after update reports 0 vulnerabilities at inspection. This excludes the separate unmerged Argos PR and is time-sensitive.
- No schema, policy, Auth setting, production record, service subscription or migration history change.

## Observed catalog snapshot (not a live counter)
- Published Places: 755; directory 668, curated 87.
- Published verified: 2.
- 6 published records satisfy the current basic Planner data-readiness predicate (coordinates, description, positive duration, resolved price decision, hours where required).
- This count does not prove ownership, media rights, data freshness or suitability for every request. A `missing` price decision can pass the existing predicate while still requiring transparent costs.
- Directory publication is not verification and does not make records Planner-ready. Workbook data rights remain an unresolved review item; never fabricate rights or verification.

## Argos gate
PR #99 has successful workflow runs but its Argos status requires review of 12 newly added screenshots. No main baseline existed at that build. The authenticated browser session expired; do not bypass its pending visual review. Reauthenticate, review all snapshots, submit the decision, merge the reviewed head, then confirm a main build and baseline.

After dependency changes merge, update/retest the Argos branch and reconcile its lockfile. Its SDK has an upstream `braces` advisory; the clean main audit above must not be misrepresented as a clean audit including that SDK. Reassess the dev-only trusted-pattern risk before merging it.

## Supabase read-only observations
- Only one accessible project/default main branch was listed. No independent staging target was established by this inspection; hidden resources are unknown.
- No public ordinary table with RLS disabled was returned by the inventory query. This does not prove each policy is correct.
- Advisor warnings: 3 anonymous SECURITY DEFINER entrypoints, 27 authenticated entrypoints, leaked-password protection disabled. Counts include intentionally callable guarded RPCs; do not revoke them blindly.
- `guard_directory_provenance()` returns trigger, fixes search_path, but is executable by anon/authenticated. Review a new additive migration revoking direct invocation from PUBLIC/anon/authenticated while retaining trigger operation. Direct trigger invocation is not evidence of exploitable escalation. Test directory provenance guards and owner/admin paths before any rollout.
- `get_shared_trip` and `track_product_event` are intentional public capabilities; preserve exact-token checks/redaction and bounded analytics validation.

References:
- https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable
- https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable
- https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

## Ordered execution plan
1. **Engineering baseline:** merge this reviewed dependency patch after CI; complete Argos review/baseline without bypass; add health-response sanitization and bounded-input/abuse controls as separate tested PRs. Check hosting-native rate-limit capabilities/costs before provisioning a service.
2. **Hosted safety gate:** owner confirms Preview binding, isolated test target or explicit limited-test exception, recoverable backup and recovery owner. Test anonymous, traveler, owner A/B, Admin, trip owner/editor/viewer/denied roles, including Storage overwrite/delete. Do not create test users/records in production or change Auth/RLS without explicit approval. Record actor-level pass/fail evidence, not just static SQL assertions.
3. **Data quality:** generate read-only readiness/duplicate/provenance backlog; resolve source rights; select 15–25 authorized Pak Chong–Khao Yai records and verify operational facts/media before publishing changes. No invented hours, prices or automatic verification.
4. **Map-to-trip:** link sourced map markers to public catalog identities, district filtering, shareable selection URLs and Place → Trip actions. Preserve unverified/directory distinctions and empty states.
5. **Real pilot:** run traveler/admin/owner journeys, record missing-data/route errors and conversion. Current route estimates are not live road travel times.
6. **Launch/growth:** resolve legal/controller/retention and media approvals, verify SEO/performance and analytics, then test disclosed monetization. Booking/payment and extra AI subscriptions remain deferred.

## Open approvals / not claimed complete
- Argos browser sign-in and human-readable baseline review.
- Independent staging / Preview environment binding.
- Backup/PITR coverage and tested recovery, not merely an app rollback.
- Live role/Auth/Storage smoke tests.
- Any live Auth or database privilege change and any paid plan.
- Catalog rights/verification and public/commercial launch sign-off.
