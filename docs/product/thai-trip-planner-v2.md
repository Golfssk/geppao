# Geppao: Thai-first trip planner implementation tracker

User-approved scope: all gaps from the public Wanderlog comparison. This is a delivery tracker, **not a claim that all features exist**. No paid APIs, billing-enabled integrations, fabricated venue facts, destructive data resets, or copied third-party media.

## Delivery 1 — implemented in this change

- [x] Add an existing published place or event to an existing trip/day directly from unified search.
- [x] Same action on directory, full place and accommodation detail pages (not fictional demo properties).
- [x] Server checks signed-in editor rights, target day belongs to trip, source remains published; unknown prices remain null.
- [x] Daily tabs, all-days view and searchable local catalog in saved-trip workspace.
- [x] Itinerary beside coordinate-based stop overview; mobile stacks overview above stops. **No basemap, road routing, live traffic or travel-time guarantee.** Missing coordinates are explicitly counted, not invented.
- [x] Private item notes editor, preserving existing lock and viewer restrictions.
- [x] Honest known/unknown price coverage instead of presenting incomplete total as a complete budget.
- [x] Owner-only share/revoke API, affected-row checks, no raw SQL errors, same-origin mutation checks.
- [x] Public HTTP share responses allowlist fields; private item notes, preferences and future wallet data excluded. The SQL RPC is also hardened in Delivery 2 before adding private wishlist data.
- [x] Read-only HTML download for offline reading, without private notes, credentials, booking docs, remote resources, or scripts. **Not a synchronized offline app.**
- [x] Preserve saved schedule editing, sparse-rank ordering, lock/unlock and read-only sharing.

No schema changes in Delivery 1. No migration needed, no production test records inserted.

## Delivery 2 — durable wishlist and day moves implemented; collaboration extended in 036

- [x] Trip wishlist/inbox independent of scheduled days; add from search/detail to inbox, assign later, remove, deduplicate. Persist per trip under RLS; do not use browser-only storage as a sync substitute.
- [x] Atomic cross-day move RPC: serialize these RPCs on the trip, validate trip/day membership and expected source day, reject locked/stale items, clear affected route segments before FK change, clear start/end time explicitly, retain notes/duration/cost, invalidate both days.
- [ ] Atomic same-day reorder and full optimistic versioning across existing direct item/recalculate APIs. The new trip lock does not serialize legacy endpoints; do not claim full conflict-free collaboration.
- [ ] Drag-and-drop with equivalent keyboard move buttons, deterministic ordering and concurrent edit/version checks.
- [x] Editor/viewer invite links (036): expiry, revocation, hashed tokens, signed-in acceptance and owner-only membership management. Public read-only share links must never grant edit access.
- [x] Trip identity/created-at immutable guard; only the owner may rotate public share tokens. Existing editor planning access retained; future owner-only fields must be added to this guard.
- [x] Replace `get_shared_trip` SQL body with strict allowlist, removing trip preferences/day notes; test RPC directly as anon as well as HTTP wrapper.
- [x] Local DB/API permission matrix for wishlist/move: anonymous, stranger, viewer, editor, owner; cross-trip IDs, stale expected day, locked items, unknown cost, rank-overflow rollback, route invalidation and direct anonymous share RPC.
- [ ] Real multi-session concurrency testing, hosted signed-in smoke tests ; invitation expiry/revocation/replay are covered locally, not with hosted user sessions.

Release gate: encrypted/controlled backup and restore verification before migration; append immutable migration 035+, RLS tests, no paid database branch.

## Delivery 3 — group planning and actual expenses (implemented core in 036)

- [x] Expense ledger: THB defaults, payer, category, date, actual vs estimated amounts, refund handling, versioned corrections and change history. Public shares exclude the ledger; receipt attachments remain unimplemented.
- [x] Named participants (adults/children/other), equal/custom selected-person shares with integer satang arithmetic and exact reconciliation. Personal balances, recorded transfers and settlement suggestions, **not actual money transfers**. Household/group hierarchy and weighted split presets remain outstanding.
- [x] Shared checklist: assignee, due date, complete/uncomplete, reusable Thai travel packs, optimistic-concurrency handling.
- [x] Manual place/date decision polls: one active choice per signed-in member/poll, clear close/reopen rules, no duplicate anonymous votes.
- [x] LINE-friendly public share title/date metadata and share action; no automatic posting or paid LINE messaging service.

Release gate: no ledger/receipts exposed via public links; non-member access denied; split totals always match expense amount exactly.

## Delivery 4 — reservations implemented; reliability extensions open

- [x] Private reservation wallet (036): hotel/transport/activity records, reference number, check-in/out, contacts, cancellation/deposit deadlines; manual input first.
- [ ] Private document storage and access checks; file size/type rules, signed downloads, retention/deletion. No Gmail scanning or paid OCR API.
- [ ] Opt-in read-only offline/PWA cache with explicit sync timestamp, logout purge, no private wallet caching by default. Keep downloaded HTML described as a static snapshot, not offline sync.
- [ ] Copy a public trip/template into a new owned draft; fresh IDs, revalidate publication and facts, never copy private notes/members/booking details.
- [ ] Nearby alternatives respecting locked stops, suitability, time windows and data confidence. Reuse rule-based engine, no paid AI dependency.

## Delivery 5 — Thai-specific planning inputs and data quality (NOT implemented yet)

- [ ] Departure location/time and hard return-home deadline, including late return warning.
- [ ] Adults/children/elderly/pets and recorded suitability/access constraints. Unknown is not equivalent to supported.
- [ ] Whole-villa vs room vs per-person/per-night pricing, extra guests, deposits and cancellation policies. Do not add incompatible units into one claimed total.
- [ ] Food preferences, heat/rain breaks, public holidays and travel buffer settings based on recorded data, not invented live weather/traffic.
- [ ] Expand beyond Pakchong only after each destination has planning-ready coordinates, durations, hours and price status. A map of 77 provinces is not nationwide planning coverage.
- [ ] Nationwide directory completeness workflow: missing facts, source dates, owner confirmation, approved media, duplicates, closure reports.
- [ ] Onboarding/usability tests with Thai travelers, families, friend groups and venue owners. These needs are hypotheses until validated.

## Verification and release rules

- Each delivery needs API auth/scope validation, RLS tests when schema changes, regression suite, typecheck/build, desktop and 390px interaction + visual checks.
- Only mark deployed after GitHub checks and production deployment confirmation.
- Never describe coordinate diagrams/Haversine estimates as real road navigation. Google Maps outbound navigation remains external.
- No paid Places/Routes/AI integrations, reservation scraping, unauthorized photos, or new recurring service subscriptions.

## Map interaction addition

- [x] Cursor-anchored mouse-wheel zoom on country and province SVGs, bounded zoom, reset and keyboard-operable +/- buttons. Wheel capture is scoped to the map; scrolling outside continues to scroll the page.
- [x] Existing region/list/province/district selection and mobile scrolling retained. No paid map SDK added.

## Delivery 2 rollout evidence

- Append-only migration 035; migrations 001–034 unchanged. Local full-chain PGlite tests and API tests use synthetic local-only records.
- Targeted pre-change function/grant/policy/schema snapshot retained outside Git; actual trip/day/item/segment tables were empty at preflight. This is not a full DB/Auth/Storage backup or independent staging. Existing owner-authorized free-target exception applies.
- Recovery is app-first rollback preserving additive objects and all new data. A manual old-function definition is retained privately for diagnosis only; restoring the old share RPC would weaken privacy and requires explicit review.
- Hosted mutation tests with real signed-in accounts remain unperformed. Production application deployment and migration verification must be confirmed separately in the PR.

## Group delivery 036 — implementation complete, rollout gates tracked separately

See [group-planning-release.md](group-planning-release.md) for precise scope, tests, limits and remaining work. Invitations, exact THB ledger/settlements, assigned checklists/Thai packs, member voting and a personal manual reservation wallet are implemented. Do not interpret the unchecked broader roadmap items above as completed in full: private attachments, full concurrency, templates, offline sync and Thai planning/data expansion are still outstanding. Deployment and hosted migration evidence must be recorded before marking this delivery live.

- Group delivery also includes versioned personal reservation editing and a public LINE summary/share action with safe title/date metadata; LINE crawler rendering on actual devices remains an external acceptance check.

## Workspace arrangement delivery 037

- [x] Unified Plan / Map / Expenses / Group views on saved trips; draft forms remain mounted across switches. Desktop Plan retains side-by-side overview; mobile Plan shows stops and Map is a separate view.
- [x] Mouse drag handle for same-day ordering and cross-day drop onto a stop, day card or day tab. Keyboard/touch users retain explicit up/down and day-selector controls. Native touch dragging is NOT claimed.
- [x] New ordering RPC compares source/target day membership, ranks and lock snapshots under trip/day/item locks. All changes commit together; stale ordering returns 409 and triggers refresh. Dense ranks are normalized safely. Up to 100 stops across affected days per operation.
- [x] Same-day locked stops are ordering anchors; cannot move one or cross it. Cross-day moves clear old time windows and preserve notes, duration and cost. Existing target-day stops retain their relative order.
- [x] Point details open in a native, portaled, Escape-dismissable dialog without leaving the trip, including from overview markers. Only already-loaded directory fields are displayed, with an external full-detail fallback.
- [x] Unique SVG grid IDs per overview.

**Concurrency boundary:** this is conflict-safe arrangement, not full itinerary concurrency or realtime sync. Legacy schedule/note/lock/add/delete and recalculation endpoints still need unified optimistic versions plus atomic whole-calculation commit. Arrangement snapshots intentionally exclude notes/price, and never overwrite those independently edited fields. A concurrent recalculation remains a follow-up risk; do not mark the broader conflict-management roadmap complete.

**Still open:** real road-map/routing provider evaluation (existing diagrams are not roads), private booking/receipt attachments, opt-in offline/PWA sync/logout purge, copying public templates, nearby/backup suggestions preserving locked/suitability constraints, Thai departure/return/party/pricing inputs and verified nationwide planning-ready data. Hosted real-account/multi-device acceptance and actual LINE app/crawler checks remain unperformed.

Release evidence belongs in the PR and issue 104 after tests, append-only migration 037 and production route verification. No paid resources or hosted synthetic records are required for this delivery.
