# M1 acceptance and recovery gate

Tracking: [PM control center #112](https://github.com/Golfssk/geppao/issues/112), [product backlog #104](https://github.com/Golfssk/geppao/issues/104).

## This slice: trip metadata and deletion

Owner-facing trip settings edit **title, status, travelers and total budget**. Dates, destination, currency and preferences are intentionally not edited here: those need a separate day-rescheduling/product design. Changing travelers invalidates cached itinerary calculations via existing migration 038; users must recalculate. Supported title length is 1–160 trimmed characters, travelers 1–100, budget null or 0–100,000,000 with at most two decimals; zero and unknown are distinct.

PATCH/DELETE `/api/trips/[id]` require a signed-in owner, same-site requests, bounded JSON and a positive safe-integer `expectedVersion`. The final UPDATE/DELETE filters **id + owner_user_id + plan_revision**, so the permission/version read is not the write guard. No affected row is a conflict (409), never a successful delete. Missing revision is 428. Unsupported fields, including dates and ownership, fail closed. Database errors are not sent to the browser. Responses are no-store.

Dirty metadata drafts retain the version they were created against, including across incoming refreshes. Conflict/uncertain saves preserve the draft and block replay until explicit reload/review. Successful saves refresh the server trip rather than guessing a new revision: AFTER triggers may increment it more than once. Delete is only shown for owners, requires an impact confirmation, sends one request and blocks blind retries on uncertain results. Reload discards page-local drafts and explicitly warns about that.

### Important scope limits

- This is an **application API/UI improvement, not a new database security boundary**. Existing direct `trips` UPDATE grants/policies still allow permitted editors to change metadata outside this endpoint. Unlike item/day writes closed by 039, direct metadata DML is not revoked here. A future RPC/grant hardening migration needs separate review, rollout and recovery approval.
- `plan_revision` tracks itinerary/planning metadata, **not group expenses, membership, polls, checklist, reservations or share-token changes**. A version-valid delete can still remove newer group records. Confirmation explicitly warns of all affected members/records and recommends reloading if others are editing; it is not full collaborative-delete protection. Production destructive-delete acceptance stays gated on explicit owner sign-off, or a future whole-trip revision/soft-delete design.
- No automatic merge of drafts, realtime subscriptions, restore/undo, date rescheduling or hard-delete backup guarantee is introduced.
- Local fixtures are synthetic and isolated. No hosted users, real trips, role changes, production publication, DB migrations or paid services were created by this slice.

## Acceptance matrix

**Local** = automated route/component logic or isolated SQL migration replay. **Hosted pending** = must be exercised in an explicitly approved isolated environment using real separate sessions. Neither mocks nor PGlite demonstrate Supabase Auth/session behavior or real simultaneous Postgres timing.

| Actor / scenario | Local evidence | Hosted gate |
|---|---|---|
| Signed out: metadata/delete | API 401, no writes | Pending: real expired/missing sessions |
| Owner: edit name/status/budget/travelers | API predicates; validation; real migration revision increments | Pending: two real sessions, reload and recalculation |
| Editor/viewer: metadata/delete UI | No delete control; metadata editor rendered only for owner; owner-filtered API | Pending: RLS via real identities; direct metadata grants separately documented above |
| Stranger/foreign trip | Owner lookup unavailable; no writes | Pending: real non-member IDs, no data disclosure |
| Stale metadata or delete | API 409; actual SQL conditional write affects zero rows; dirty UI retains old revision | Pending: genuinely concurrent sessions and item edits |
| Connection lost after request | No blind resend; retained draft; explicit reload | Pending: real response loss after commit |
| Delete removes dependencies | SQL migration replay verifies trip/day cascade; impact copy covers group records | Pending: all dependency tables, shared-link expiry and approved destructive fixture |
| Bad inputs / cross-site / old clients | Bounded body, allowlist, origin, version and sanitized-error tests | Pending: browser session/CSRF behavior |
| TH/EN + mobile/desktop | SSR and component-handler tests; isolated Chromium QA script | Pending: full authenticated app screenshots and keyboard/screen-reader acceptance |
| Invitation, expenses, checklist, polls, private reservations | Existing group planning regression, not expanded by this slice | Pending: two-account end-to-end acceptance |
| Public share/offline export privacy | Existing allowlist regressions, no new public fields | Pending: verify real anonymous payloads without private group data |

Reproduce:

```sh
npm ci
npm run check
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/path/to/chromium QA_OUTPUT=/tmp/trip-settings-qa node scripts/qa-trip-metadata.mjs
```

The Chromium script mounts the actual React components with isolated network responses; it does not log in to Supabase or upload to Argos. Keep screenshots out of source control.

## Environment / recovery gate before hosted acceptance

1. Identify exact frontend deployment **and its database/Auth/storage targets**. A Vercel Preview alone is not an isolated backend. Do not use it for synthetic writes if it points at production.
2. Confirm an existing approved free isolated project or obtain explicit approval for project creation/cost. Record environment identifiers without secrets, migration/grant state and the exact tested app SHA.
3. Have the owner supply/approve test identities and data scope: owner, editor, viewer, unrelated user, anonymous; real separate sessions. Do not auto-create production users or silently change membership.
4. Establish backup availability, retention and an agreed restore procedure. Rehearse restoration only in the approved isolated environment; do not call a backup “verified” without a successful rehearsal. Never log access tokens, private reservation details or share tokens.
5. For destructive test cases, list the fixture trip IDs and cascaded tables, get specific approval, then verify only those IDs. No broad cleanup/reset. Prefer non-destructive tests until the delete boundary is agreed.
6. Execute the matrix against one exact build; record actual results, sanitized evidence and unresolved failures. Do not mark M1 accepted while hosted rows are pending.
7. Release only after CI/build/migration checks, visual review, compatible deployment verification and authorized merge. This slice adds no migration. After 039, recovery must be a forward fix or a revision-compatible app build; do not restore raw-item/day-DML builds or re-grant revoked helpers.

## Next PM checkpoints

- **M1 remaining:** hosted multi-account/private-data acceptance; recovery rehearsal; decide whole-trip deletion/version boundary and direct metadata RPC/grant hardening. Public Pilot remains deferred.
- **M2:** road/geographic map provider decision, real Thai suitability/time/price constraints, verified source coverage and transparent missing data.
- **M3:** copyable templates, nearby/backup options, private-file uploads and offline/PWA design (permissions, retention, sync/conflicts first).
- **M4:** public-pilot legal/media rights, operational ownership, quality thresholds and launch approval. Review dependency/map PRs individually; no bulk merge.
