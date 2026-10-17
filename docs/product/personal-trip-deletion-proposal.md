# Personal-trip deletion boundary — proposal, NOT deployed

Tracks #116; based on main after #113. This is a conservative loss-prevention boundary, not a completed collaboration revision / restore design.

## Decision

Permanent deletion is permitted only for an owner-operated, currently unshared trip with no group records. A non-null share token, membership, invitation (including expired/revoked invitations), participant, expense, transfer, checklist, poll/vote, group audit, or reservation blocks deletion. This intentionally includes another user's private reservation, even when RLS hides it from the trip owner. No private values or category details are returned.

Offer **Archived** instead. Archiving is an ordinary status change: it is NOT access revocation, link revocation, soft-delete, or a recovery guarantee. An active sharing link remains active until explicitly revoked.

## Code and rollout

1. Review `docs/sql/proposals/trip-personal-delete.sql` as additive Phase A: BEFORE DELETE trigger plus owner/revision-aware `delete_personal_trip(uuid,bigint)` RPC. It protects the current raw API path once applied.
2. Prepare and test an application change to use the RPC. Map SQLSTATE `55006` to a generic, localized `trip_has_shared_data` conflict; do not show SQL messages, table names, or reservation details. Preserve no-store, same-origin checks, expectedVersion validation, no-success-on-zero-rows, duplicate request protection, and explicit reload after uncertain outcomes.
3. Only after application rollout and multi-account checks, review `trip-personal-delete-cutover.sql` to revoke raw browser-role DELETE privileges. Old raw-DELETE application versions are not rollback-safe after cutover.
4. These files are outside ordered migrations and the manifest. No hosted SQL, privileges, users, or data have been changed by this PR. Do not merge as an implied production activation.

## Serialization and limits

The RPC locks the owner/parent row, checks the actual itinerary revision using the existing helper, then deletes. Existing group mutation RPCs also lock the parent first. The trigger checks all direct FK children of trips except the explicitly personal itinerary days and wishlist. Identifiers are catalog-derived and quoted; the ID is bound, not interpolated. Composite/unrecognized parent keys fail closed. Private child data is checked by a fixed-search-path SECURITY DEFINER function with no public execute grant.

The design avoids pretending that `plan_revision` tracks group writes: newly created group data must block deletion even with an unchanged itinerary revision. Existing group data is never purged to make a trip eligible. The intended common response is archive instead.

Catalog scanning covers new direct FK children, not arbitrary future nested data under days/items/wishlist, external stores, or records without a FK. Schema review must preserve this boundary. No recovery period, restore UI, backup policy or service-role maintenance bypass is introduced.

## Evidence and remaining acceptance

The new Node/PGlite tests execute the real migration chain and proposed SQL. They cover current raw-path protection, RPC cutover, stale/missing revision, repeated deletion, owner/editor/viewer/unrelated/anonymous roles, share-token-only changes, every group category (including nested money/votes), hidden reservations, atomic preservation, and a future direct FK child. PGlite auth/storage are doubles: this is NOT hosted Supabase acceptance and NOT a multi-connection concurrency proof.

Before any promotion: verify real Postgres two-session races (group-first and delete-first); demonstrate either refusal with all group data intact or deletion before group creation with the writer failing without orphan data. Test raw member insert FK/lock behavior as well as group RPCs. Verify RLS and anonymous sharing using distinct accounts, backups and an approved restore rehearsal in an independently isolated backend. Test rollback only to RPC-compatible builds. Confirm deletion UX in TH/EN and mobile. #115 tracks environment/cost authorization; #114 separately addresses metadata grants. Both gates remain open.
