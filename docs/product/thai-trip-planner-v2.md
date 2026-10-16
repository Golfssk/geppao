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
- [x] Public HTTP share responses allowlist fields; private item notes, preferences and future wallet data excluded. Existing SQL RPC still requires hardening below before introducing private trip-level features.
- [x] Read-only HTML download for offline reading, without private notes, credentials, booking docs, remote resources, or scripts. **Not a synchronized offline app.**
- [x] Preserve saved schedule editing, sparse-rank ordering, lock/unlock and read-only sharing.

No schema changes in Delivery 1. No migration needed, no production test records inserted.

## Delivery 2 — durable wishlist, day moves, and collaboration (NOT implemented yet)

- [ ] Trip wishlist/inbox independent of scheduled days; add from search/detail to inbox, assign later, remove, deduplicate. Persist per trip under RLS; do not use browser-only storage as a sync substitute.
- [ ] Transactional cross-day move and reorder RPC: lock trip/affected days/items; check editor and locked state; clear stale route segments; move item; preserve local time relative to new date or explicitly clear schedule; invalidate both days' calculations. Current same-day composite route FKs mean a plain PATCH is unsafe.
- [ ] Drag-and-drop with equivalent keyboard move buttons, deterministic ordering and concurrent edit/version checks.
- [ ] Editor/viewer invite links: expiry, revocation, hashed tokens, signed-in acceptance and owner-only membership management. Public read-only share links must never grant edit access.
- [ ] Tighten direct Supabase policies/column privileges so editors cannot transfer ownership, rotate public tokens, or edit owner-only metadata through direct table access.
- [ ] Replace `get_shared_trip` SQL body with strict allowlist, removing trip preferences/day notes; test RPC directly as anon as well as HTTP wrapper.
- [ ] Permission matrix: anonymous, stranger, viewer, editor, owner; cross-trip IDs; concurrent mutations; expired invites; locked items.

Release gate: encrypted/controlled backup and restore verification before migration; append immutable migration 035+, RLS tests, no paid database branch.

## Delivery 3 — group planning and actual expenses (NOT implemented yet)

- [ ] Expense ledger: THB defaults, payer, category, date, actual vs estimated amounts, refund handling, edit history and receipt privacy.
- [ ] Participant groups (adults/children/families), equal/unequal/custom shares with integer satang arithmetic and exact reconciliation. Personal balances and settlement suggestions, **not money transfers**.
- [ ] Shared checklist: assignee, due date, complete/uncomplete, reusable Thai travel packs, optimistic-concurrency handling.
- [ ] Place/date voting: one member vote per option, clear close/reopen rules, no duplicate anonymous votes.
- [ ] LINE-friendly public share title/preview and share action; no automatic posting or paid LINE messaging service.

Release gate: no ledger/receipts exposed via public links; non-member access denied; split totals always match expense amount exactly.

## Delivery 4 — reservations and reliability (NOT implemented yet)

- [ ] Private reservation wallet: hotel/transport/activity records, reference number, check-in/out, contacts, cancellation/deposit deadlines; manual input first.
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
