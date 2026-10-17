# Workspace arrangement 037 — release and recovery

Scope: saved-trip UX and transactional arrangement, not a full Wanderlog clone or a road map.

## Release gates
- Append only migration 037; migrations 001–036 and their checksums unchanged.
- Existing free target only, no project/branch/billing creation. Targeted schema/function/count/fingerprint snapshot is not a full DB/Auth/Storage backup or independent staging.
- PGlite full-chain tests cover stale order, lock anchors, foreign trip/day, viewer/stranger/anon, no-op, dense ranks, route invalidation, preservation of time/content and cross-day time clearing. API tests cover same-origin/auth/body/limits/error mapping. These local tests do not prove hosted multiactor behavior.
- Actual React components compiled with SWC/webpack and tested in isolated Chromium at 1440 and 390 px with mock network: native mouse drag, day-tab drop, keyboard button alternative, map-marker details/Escape, viewer controls, draft preservation, 409 refresh, no overflow/runtime errors. Not a hosted account acceptance test.
- Full regression, TypeScript/build and real Postgres migration reset/lint must pass in GitHub CI before apply/merge.
- Apply migration before frontend; verify PUBLIC/anon execute denied, authenticated allowed and venue/event fingerprints unchanged. Production unauthenticated/cross-site HTTP checks are non-mutating route/deployment evidence only.

## Recovery
Rollback application first. Migration 037 only adds one function and grants; it rewrites no existing rows, schema, table policies or prior functions. Keep the additive function and all user data during rollback. Do not reset tables or downgrade the privacy-hardened shared-trip RPC.

## Limitations
- Native HTML drag is mouse-first; keyboard/touch alternatives are explicit buttons/select, not touch drag.
- Affected-day ordering snapshots cover membership/rank/locks only, maximum 100 stops. Notes/prices are deliberately not overwritten. No automatic retry after stale/conflicting order.
- Legacy item content editing/recalculation is NOT fully versioned/transactional yet. No realtime push/presence.
- Coordinate diagram is not a road map, offline map or traffic feed. Downloaded HTML remains a static read-only copy, not PWA sync.
- Full details use saved public directory fields; opening hours/prices/suitability are not invented or guaranteed current.
- Group, private wallet and public share privacy boundaries from 035/036 remain unchanged.
