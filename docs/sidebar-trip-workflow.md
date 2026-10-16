# Traveler sidebar and planner workflow

## Scope
- Remove Stories from primary navigation and homepage editorial content. Keep `/stories` routes and stored articles intact.
- Collapsible desktop sidebar, mobile modal drawer with focus trap, Escape and focus restoration. Admin and host onboarding keep their focused shell.
- Rust `#b75326` / warm neutrals balance the existing forest brand and map greens.
- Planner: required valid dates (1–14 days), travelers (1–30), optional total budget, trip title, estimated visit slots using durations and travel buffers, honest unknown-price coverage.
- Versioned session-only draft expires after 24 hours; survives login navigation in the same browser tab. No automatic account save. Parameter changes require regenerating before saving.
- Save validates day/item structure, rechecks publication, preserves day-specific time slots, and returns the created trip ID even if recalculation fails. Partial item/day failures return a recovery ID rather than encouraging duplicate retries.
- Saved trip items: scoped edit/delete checks, sparse integer ordering, explicit start/duration editor in Thailand timezone, locked-item protection, network errors and clipboard fallback.

## Language follow-up
- Compact accessible TH/EN segmented control; language changes refresh server-rendered copy and persist across navigation/reload.
- Generic GepPao planner heading; automatic-generation pilot disclosure remains separate and accurate.
- Localized homepage support sections, planner errors/type labels, saved-trip list/workspace and schedule controls. User-entered titles and source place names/descriptions are preserved, not machine-translated.

## Verification
- `npm run check`: migration integrity, 324 unit/route tests, TypeScript, production build.
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=$(command -v chromium) npm run test:visual -- --workers=2`: 10 browser tests: desktop/mobile locale switching and compact controls, destination flows, homepage stories removal, planner form/draft/login boundary, stale-plan prevention, sidebar keyboard controls and horizontal-overflow checks. Synthetic plan and API responses only.
- Argos captures the existing 12 destination states plus two planner states. Visual differences are intentional and need review, not automatic baseline approval.

## Release boundaries / remaining work
- No migrations, RLS/Auth changes, dependency changes, publication/verification changes, production test accounts, or live trip writes are part of this work.
- Real signed-in create → refresh → edit → share must still be tested on an isolated staging database. Local mocked route tests and browser fixtures do not prove deployed RLS behavior.
- Current automatic generation is a Pak Chong–Khao Yai pilot, not nationwide routing. Published does not mean verified or bookable.
- Times and routes are estimates; generation does not guarantee operating hours or event-slot feasibility. Saved-trip recalculation reports available validation data; it does not automatically reschedule every stop after reordering. Review and adjust times explicitly.
- Known costs are not a complete trip budget; transport, rooms and missing prices may require manual confirmation. Sparse source data can leave days empty, shown explicitly in the preview.
- Existing densely ranked trips can have reorder controls disabled where there is no integer gap. Concurrent edits are not serialized. No new atomic reorder RPC was introduced.
- Create + items is not one database transaction; partial-save recovery is exposed. A lost network response after commit is not an exactly-once guarantee; server idempotency remains future hardening.
- Draft storage is tab-local, not cross-device synchronization, and does not include credentials.
