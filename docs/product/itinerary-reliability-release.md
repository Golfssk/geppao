# Itinerary reliability release — 038 / 039

## Scope
- Trip-wide monotonic `plan_revision` is server-owned. Item/day changes and planning metadata changes advance it. Group-tool edits and public-share token rotation alone do not invalidate plan forms.
- Add/edit/delete/lock, arrangement, cross-day move and wishlist scheduling lock the trip first and compare the revision before writing. Missing revision is HTTP 428; stale is 409. Reordering also retains 037's membership/rank/locked-anchor snapshot checks.
- Recalculation reads one coherent SQL snapshot with a fingerprint of trip/item/published-source inputs; one commit RPC verifies the version/fingerprint, complete exact day/item sets, locked/manual values and route endpoint scope. All updates, old-route deletion and summaries commit or roll back together. There is no partial per-day save.
- Preserve existing legacy/manual price and duration values, including unknown locked price. Explicitly automatic planner/wishlist/add fields can be recalculated. Editing a value marks it manual; clearing cost requests an automatic estimate. These are estimates, not confirmed prices. No paid routing or live traffic.
- Withdrawn venue/event facts are stripped from calculation snapshots, which require edit permission. Public sharing/offline allowlists remain unchanged.
- Notes/time drafts retain their original revision across incoming refreshes; a dirty draft cannot silently adopt a newer revision. Conflicts preserve the draft and require explicit review/discard. A server conflict pauses editing; a network-uncertain outcome requires reloading before retrying. No automatic replay of writes.
- Direct authenticated/anonymous item/day/route DML and old unversioned arrange/move/schedule/summary RPC execution are closed by 039. New seed and calculation RPCs validate authorization and inputs inside SQL; application checks alone are insufficient.

## Rollout gates / compatibility
1. Test exact PR head: entire local regression, app TypeScript, actual-component Chromium desktop/mobile behavior, CI validate/build, real Postgres migration reset/lint, public visual suite.
2. Record hosted counts/source fingerprints/share-function hash and grants on the already approved free project. No hosted fixture users/trips or destructive reset.
3. Apply **038 only** before deploying: additive fields/functions/triggers; old raw-DML paths remain temporarily executable so the existing deployment is not broken during rollout. Internal helper privileges are restricted immediately.
4. Merge exact tested head; wait for the compatible deployment. Verify the new recalculation origin guard, basic public routes and signed-out guards.
5. Apply **039** after deployment verification to revoke raw DML and unversioned writes. Verify function/table grants and unchanged source fingerprints. The application and SQL revision checks are then the only normal itinerary write paths.

After 039, **do not restore the old raw-DML build or blindly re-grant old write paths**. Recovery is a forward fix or a revision-compatible application build, preserving schema/data. Before 039, a rollback to the prior application is still possible while additive 038 remains. No DROP/reset/data deletion is a rollback plan. A short pending-cutover period is explicitly tracked, not claimed as full protection.

## Evidence and limits
The isolated PGlite suite replays real migrations with synthetic auth/storage fixtures. It exercises stale-editor interleavings, rollback, authorization, denied direct writes, source changes, manual/locked values and seed atomicity. This is not evidence of live multi-session timing or hosted two-account acceptance. Real Postgres CI validates migration reset/lint separately; native Chromium QA uses actual components with a mock network, not hosted accounts.

Follow-up M1 slice: owner metadata/delete forms now use conditional revision-aware application writes and explicit conflict/uncertain-result handling. See [technical MVP acceptance](technical-mvp-acceptance.md) for evidence and the direct metadata DML / group-data deletion limitations; this is not full database-boundary hardening or hosted acceptance. Still separate: realtime subscriptions/conflict merge, genuine road map/provider selection, private file uploads, PWA offline sync, template copy, nearby/backup planning and deeper Thai travel/price/suitability data. No new paid services.
