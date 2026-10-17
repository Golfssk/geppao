# Group planning — additive delivery 036

## Implemented in this delivery

- Signed-in, single-use, seven-day invitation links; persist only SHA-256 token hashes. Owner-only creation, revocation, member role change/removal. Accepting a link never silently changes existing membership.
- Shared THB expense ledger, payer/date/category, equal or custom shares for explicitly selected participants, signed refunds, exact integer-satang reconciliation. Adults/children/other can participate without accounts. Actual spending is separate from planning estimates.
- Edit/remove expenses with expected-version checks; corrections to transfer records; per-person balances and suggested settlements. No banking, payment processing, receipts or exchange rates.
- Assigned checklist tasks, due dates, versioned completion/removal, deduplicated road-trip/family/pet preparation packs.
- One vote per signed-in member, change choice until closed, editor close/reopen. These are manual decision polls; no automatic itinerary replacement.
- Personal manual reservation wallet: reference, Thailand-local start/end/deadline, contact and deposit/cancellation notes. Versioned add/edit/remove; no provider cancellation action. Other members, including trip owner, cannot read another account's wallet.
- Public share summary copy for LINE, explicit LINE share action, and title/date preview metadata. Only public allowlisted schedule fields are used; no automatic message posting.
- Private group tools mounted after the existing trip workspace, Thai/English labels, desktop/mobile layouts, loading/error/retry and read-only controls.

## Security and limits

All new tables use RLS with authenticated read policies and RPC-only writes. Anonymous shared-trip RPC from 035 retains its strict allowlist: no group ledger, participant list, membership, checklist, votes or reservation wallet. Wallet contents never enter shared group audit. Group mutations serialize on the trip row; expense/task/poll changes compare versions. This does **not** claim complete conflict handling for older itinerary/recalculation APIs.

Caps per trip: 50 named expense participants, 1,000 expenses, 1,000 transfer records, 300 tasks, 100 polls, 1,000 invitations, 5,000 audit rows; 100 personal reservations per account/trip. Individual money entries are capped at THB 10m. No new paid resource, API or subscription.

The latest-change view displays action and timestamp, not a full accounting/audit export. No realtime synchronization: members refresh after another person changes data. Invitation links are bearer capabilities until accepted, expired or revoked; send only to the intended person.

## Verification

- Local full regression: 358 passing tests. Migration chain runs in PGlite with synthetic auth/storage doubles, not real Supabase Auth/Storage.
- New database tests: owner/editor/viewer/stranger/anon, raw-write denial, cross-trip scope, invitation expiry/revocation/replay/no elevation, ledger exactness/refunds/rollback/stale versions, transfer correction, checklist pack dedupe, closed polls, wallet privacy and direct anonymous share allowlist.
- New HTTP tests: same-origin, auth, invalid/oversized body, allowlisted dispatch, scoped trip ID and sanitized errors.
- Source TypeScript check passed. Full CI build, real Supabase migration reset and deployment remain required gates.
- Actual component with isolated network fixtures: 1440px/390px five tabs, vote/close/checklist actions, viewer restrictions, loading/error states, no horizontal page overflow or browser errors. Fixture content is never inserted into hosted data.
- Real signed-in production acceptance and simultaneous multi-browser editing remain to be tested with user accounts. No real account or payment is fabricated.

## Rollout and recovery

Append-only 036, no venue/event updates. Before applying: record existing trip/member counts and directory fingerprints; retain affected membership/schema snapshot outside Git. Existing project is the owner-approved free target, not independent staging and not full PITR. Apply 036 only after CI gates. Verify table RLS, grants and unchanged source-data fingerprints. Roll back application code first while retaining additive tables and user data; do not drop group tables to roll back.

## Still outside this delivery

Drag-and-drop and full itinerary optimistic concurrency; integrated mobile Plan/Map/Expenses navigation and detail drawer; personal reservation files/signed downloads/retention; offline/PWA synchronization/logout purge; template copying; nearby alternatives and suitability-aware replanning; richer Thai departure/return/adult/child/elderly/pet and whole-villa pricing constraints; nationwide planning-ready data workflow and real-user usability studies. Existing offline HTML remains a static snapshot, not offline maps or sync.
