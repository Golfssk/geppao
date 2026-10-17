# M1 — metadata SQL boundary proposal (NOT APPLIED)

Tracking: [PM #112](https://github.com/Golfssk/geppao/issues/112), [application slice #113](https://github.com/Golfssk/geppao/pull/113).

## Status and evidence boundary

This branch proposes and tests SQL only. Neither file is in `supabase/migrations`; the canonical migration sequence/manifest, application routes and production grants are unchanged. Do NOT apply either SQL file to a hosted project as part of reviewing or merging this documentation/test branch. Passing isolated SQL tests is not hosted Auth/PostgREST acceptance.

Read-only environment discovery found one accessible Supabase project (`ndpwapelblkwqkbolyim`) and only its default `main` branch. There is no independently verified isolated backend in that result. A Vercel Preview may point at the same database and must not be treated as isolation. No project/branch/user was created and no production data, schema or grants were changed.

## Proposed phases

**A — additive RPC** (`docs/sql/proposals/trip-metadata-rpc.sql`): `patch_trip_metadata(uuid,bigint,jsonb)` validates the authenticated OWNER inside SQL, locks the parent row, checks the existing plan revision, validates an explicit normalized payload and updates only title/status/travelers/budget. Existing triggers own the final revision and calculation invalidation. No owner ID, destination, dates, currency, preferences, share token or arbitrary columns are accepted. Function execution is revoked from PUBLIC/anon and granted to authenticated; the owner check is still mandatory.

**Application compatibility step — NOT implemented in this proposal**: change PATCH to call the RPC with its existing normalized metadata payload and expectedVersion. Keep origin/body/auth validation and map 42501/40001/22023 to sanitized 403/409/400 results. Missing RPC fails closed. Deploy only after Phase A is verified. Check real owner edits, stale draft conflicts, failed requests, sharing and create-trip behavior. #113 still uses a raw conditional UPDATE and would break if Phase B ran first.

**B — post-deployment grant cutover** (`docs/sql/proposals/trip-metadata-cutover.sql`): revoke table AND all pre-existing per-column UPDATE privileges for PUBLIC/anon/authenticated. Preserve only UPDATE(share_token,updated_at) for the existing owner-share endpoint; existing RLS and `guard_trip_owner_fields` remain in force. Do not grant UPDATE on metadata or plan_revision back to browser roles. Security-definer creation/itinerary RPCs remain usable. Deployment order is a hard gate, not a best-effort recommendation.

The tests deliberately seed an old column-level title grant before cutover to demonstrate that table-level REVOKE alone is insufficient. Replay uses actual repository migrations plus synthetic auth/storage fixtures, not hosted service-role access or real user sessions.

## What this does NOT fix

- No whole-group deletion revision/soft delete or restore mechanism. Existing raw trip DELETE remains under current owner RLS and #113's application predicate. New expenses/members/polls/checklist/reservations still do not bump plan_revision; do not claim collaborative deletion is solved.
- No changes to dates/day rescheduling, currency/preferences editing, direct INSERT policy, public-share payloads, admin/host data, paid routing, realtime merge or private files.
- No live grants audit or PostgREST schema-cache/deployment verification. Existing role memberships/custom grants need a read-only audit before promoting a cutover migration.

## Required promotion/recovery checklist

1. Owner approves an existing truly isolated database/Auth/storage target, fixture identities and destructive-test scope, or explicitly approves creating a project and any cost. Preview frontend isolation alone is insufficient.
2. Replay canonical migrations and both proposals there; real owner/editor/viewer/stranger/anonymous sessions test RPC, direct REST bypass, share rotation, creation and trigger invalidation. Capture role memberships and both table/column grant results without secrets.
3. Decide and test whole-trip deletion semantics separately. Do not run destructive shared-trip tests until their exact fixture IDs and cascade scope are approved.
4. Record backup/retention and successfully rehearse restore in isolation. Do not describe an untested backup as recoverable.
5. Only then promote reviewed SQL into new ordered migrations with manifest hashes, implement the RPC client, and execute A → compatible application → B with explicit hosted-change approval.
6. After B, recovery is a revision/RPC-compatible application or forward fix, not a rollback to raw metadata writes or re-granting broad UPDATE. Existing 039 item/day/route restrictions must remain intact.

No merge of this proposal, green CI or Vercel preview is authorization to apply SQL to production. M1 and Public Pilot remain open.
