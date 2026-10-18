# Incremental hardening of the existing backend

## Operating decision

The owner confirmed that there is only one Supabase project and explicitly
approved continuing on the existing main backend. Decision recorded in #115.
This replaces the requirement to create an isolated backend before **every**
change; it does not turn production into an isolated test environment or establish
successful multi-account, concurrency, provider or restore acceptance.

Scope of this batch: least-privilege trigger execution, catalog inspection and
anonymous read-only smoke. No users, emails, customer records, RLS policies,
provider/SMTP configuration, secrets, billing or paid infrastructure are changed.
Destructive/recovery drills and deliberate failure/race tests must not use real
production records. Metadata and deletion proposals #114/#117 still require their
staged compatible-application cutovers; do not apply them wholesale.

## Observed baseline (2026-10-18 UTC)

- Project `ndpwapelblkwqkbolyim` is `ACTIVE_HEALTHY`, PostgreSQL 17.
- Migration history includes versioned writes and write cutover (038/039).
- Catalog inspection found zero ordinary public tables with RLS disabled.
  This alone does not prove policy correctness or account isolation.
- `guard_directory_provenance()` returns `trigger`, is attached/enabled on
  `public.places`, and had PUBLIC/anon/authenticated EXECUTE permissions.
- Definition MD5 before change: `7f8d7ff85470131b92ae09792b838fb1`.
  This is a change-detection fingerprint, not a cryptographic security assertion.
- Anonymous REST probes for trips/days/items/members returned no rows; probes
  for invites/expenses/reservations returned permission denial. No row contents
  were logged. Zero rows is not proof of cross-account enforcement.
- Public Auth settings report Google and email enabled, signup enabled and email
  auto-confirm disabled. No Auth settings were changed; provider consent/PKCE,
  confirmation delivery, signup policy and SMTP have not been acceptance-tested.
- Security advisor flags public/signed-in SECURITY DEFINER functions and disabled
  leaked-password protection. These warnings need per-function review, not blanket
  EXECUTE revocation. Shared-trip and product-event anonymous APIs are intentional.
  Password-protection enablement/plan requirements are not verified in this batch.

## Migration 040: narrow trigger-function ACL correction

`040_internal_trigger_execute_boundary.sql` is appended to the immutable manifest.
It asserts an existing enabled trigger attachment and trigger return type, then
revokes direct execution from PUBLIC, anon and authenticated only. It verifies
that no inherited EXECUTE access remains. Drift or error aborts the transaction.
Lock and statement timeouts bound deployment waits.

The body, trigger attachment, table permissions, RLS, existing service-role grant
and all customer records remain untouched. Ordinary trigger firing does not
require an application caller to hold EXECUTE on its already-attached function.
Existing business-owner and Admin workflows are covered by regression tests.
This reduces unnecessary API exposure; it is not evidence that direct trigger
invocation previously bypassed PostgreSQL's trigger-only call restriction.

### Promotion and evidence

1. Run `npm run check` and exact-head CI, including real PostgreSQL reset/lint.
2. Merge reviewed code; apply the identical SQL through the migration tool under
   name `internal_trigger_execute_boundary_040` on the confirmed project.
3. Verify effective anon/authenticated EXECUTE is false, service-role EXECUTE
   remains true, the definition fingerprint and enabled attachment are unchanged,
   and public tables still have RLS enabled. Record migration version/evidence in
   the deployment PR and #115/#120, without secrets or record contents.
4. Repeat anonymous read-only smoke. Stop on errors; do not relax RLS or broaden
   grants merely to make a check green.

The procedure is not a deployment assertion. Actual hosted results and migration
version belong in the PR deployment comment; until present, assume unverified.

### Recovery boundary

The transaction fails atomically before commit. No record backup is needed to
reverse this ACL-only change, but database backup availability/retention and a
restore rehearsal have **not** been established. Do not claim guaranteed recovery.
If a post-commit regression is attributable to this change, investigate the caller
first. The original public EXECUTE grant can be restored by a separately reviewed
compensating migration only; do not edit old migrations, remove the trigger,
disable RLS, or run a broad reset. No automatic security-weakening rollback.

## Verification limits / next work

Four new real-migration-chain PGlite regressions cover direct-call denial,
ordinary owner writes/other-user visibility, anti-forgery/Admin behavior and
repeatable ACL correction without body/attachment/service-role changes. Auth and
storage in those fixtures are test doubles. CI local PostgreSQL is not hosted
Supabase/Auth/PostgREST multi-account acceptance.

Next: non-destructive real-account login/session/trip acceptance with explicit
fixture scope (or the owner's existing session), followed by staged metadata RPC
integration. Google/PKCE, Safari, session revocation, recovery email delivery,
backup/restore and group-data deletion remain open work. No production synthetic
users or outbound email are created/sent in this batch.
