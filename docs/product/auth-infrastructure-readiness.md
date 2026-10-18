# Auth / infrastructure readiness

## Scope of this first hardening PR

Existing Supabase password sign-in and Google OAuth are retained. No hosted Auth configuration, user, password, SMTP setting, redirect allowlist, schema, billing or provider secret is changed. This PR fixes return-path validation consistently across browser sign-in, OAuth callback and legacy `/login`, preserves return path/locale, catches provider/network exceptions, prevents overlapping sign-in attempts, translates errors from stable error codes, and marks callback redirects private/no-store/no-referrer.

The previous startsWith('/') check accepted browser-normalized backslash authority paths; the legacy alias also dropped `next`. Neither a validated return URL nor the locale is an authorization signal. Private pages/API and database RLS must still verify permissions.

The SSR proxy now calls the validated Auth `getUser()` flow for requests containing session cookies, forwards refresh/deletion cookies to both downstream server rendering and the browser, and disables shared caching for those requests. Anonymous and PKCE code-verifier-only requests do not incur that refresh call. This cookie-presence optimization never grants access. Provider/network exceptions do not manufacture an identity, clear sessions speculatively, or expose error details. Private consumers still validate independently; their existing authorization is not replaced.

Tests under `host-auth-*` run through existing `npm run test:host` / `npm run check`. Route/session and real-component logic tests use mocked Auth, not real credentials or hosted acceptance. No password/token/provider error value is logged or persisted by this change.

## Audit findings and next gates

- Existing public login supports password and Google. Signup/confirmation and password recovery UI are not implemented in this first PR; do not advertise those flows as working.
- SSR refresh-cookie propagation has mock coverage for chunk rotation, expiry cleanup, downstream headers, public no-session requests and outages. Actual hosted renewal, Safari/mobile behavior and cross-account cache isolation still require acceptance.
- Existing logout calls Supabase signOut and refreshes navigation; verify actual cookie clearing, stale tabs and expired refresh tokens in an isolated environment.
- Decide account creation/confirmation policy and configure verified SMTP, password policy, production/callback origins and reset URL allowlist only after explicit operator approval. Recovery must require a valid recovery session and must never put secrets in logs or query strings.
- Do not send real reset/verification emails or create hosted test users as part of automated tests without authorization.
- Hosted Google consent/callback, PKCE replay, expired session, sign-out and private route behavior remain acceptance gates. Mocked tests do not prove provider enablement or production redirect configuration.
- Use approved isolated Supabase resources for multi-account and destructive/recovery tests (#115). Preview UI alone is not proof of backend isolation.
- Add operational monitoring, no-secret error reporting, backup/restore rehearsal and staged deployment acceptance after the auth/session boundary is covered.

## Related work

#113 metadata UI/API released to main; production smoke still required. #114 metadata grants and #117 personal deletion boundary remain proposals, not deployed database protections. Do not close security/recovery milestones merely because CI is green.

## Logout / client lifecycle hardening

The root client boundary now listens for Auth identity changes only when the server
rendered an authenticated user. Logout masks the old UI and replaces the document
instead of relying on a client-router refresh. Account changes likewise hide the
old document and reload the current internal route for server authorization.
Guest sign-in redirect ownership remains with the form / PKCE callback, avoiding
competing redirects. Supabase signOut's existing default scope is unchanged.

On focus, visible-tab restoration and persisted pageshow, authenticated pages
validate with getUser. While verification runs, child DOM is hidden/inert but
remains mounted (unsaved form values survive same-user validation). Network or
provider failure keeps content hidden with localized retry; it does not clear
cookies, revoke sessions or speculate that the user signed out. Auth callbacks
stay synchronous; no awaited Auth operation runs inside the SDK callback.
Cleanup and stale in-flight responses cannot reveal a document after transition.
This UI boundary is not authorization: server getUser and RLS remain required.

Coverage: nine additional behavioral regressions in host-auth-lifecycle plus
`scripts/qa-auth-lifecycle.mjs` (actual React, local Chromium, TH/EN at 390/1440).
The browser harness uses synthetic Auth and a synthetic BroadcastChannel only;
it does not prove real Supabase cross-tab delivery, cookie revocation, BFCache
behavior in Safari, real Google OAuth, or production account isolation. Run with
`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/path/to/chromium node scripts/qa-auth-lifecycle.mjs`.
No external requests are allowed by the harness.

The account-scoped follow-up below supersedes the earlier unnamespaced draft
finding. Local mocked coverage must not be equated with hosted account isolation.
Hosted multi-account acceptance remains gated by #115. No hosted configuration,
schema, credentials, users or emails are changed here.

## Account-scoped Planner draft follow-up

Planner now uses a v2 per-tab sessionStorage namespace per server-rendered user ID
and a separate guest namespace. The envelope owner must match its key. Malformed,
oversized, expired (24h since last save) and future-dated drafts are not restored.
Logout/account switch retains the old account's draft only in its namespace, for
that account to resume in this tab. It is never copied into the guest namespace
or another account. Existing unowned v1 data is retained but quarantined with a
localized notice: no migration can safely infer its original owner.

A signed-in Planner may offer a guest draft without automatically displaying its
contents. An explicit localized adopt/replace action copies to the chosen account
before removing the guest source; the UI clearly states that it replaces the
current account draft. Copy failure preserves the source. Removal failure leaves
both copies. Any unresolved save marker in either draft survives adoption.

This is automatic-restore isolation, not encrypted storage or authorization.
Same-origin scripts, extensions/devtools and the same browser profile can inspect
sessionStorage. No credentials, tokens or provider errors are stored in the draft.

The root Auth boundary owns an in-memory draft scope. Session checking pauses
writes and invalidates operation snapshots. Same-user verification allows fresh
operations, never late responses. Identity departure closes the scope permanently.
Planner ignores generation/save results after invalidation or route unmount and
never navigates to a stale returned trip ID. Server identity changes remount the
content subtree. It cannot cancel a database request already accepted under its
original identity; server Auth and RLS remain authoritative.

The from-plan API now requires `expectedOwnerId` to match independently validated
getUser(). Missing/null/mismatched values return private/no-store 409 with
`ACCOUNT_CHANGED` before publication reads/writes. Old clients must reload. The
expected owner is a stale-client assertion, not an access grant.

Before save, Planner records an unresolved-save marker in its own draft. Ambiguous
network/5xx responses and identity-check invalidation retain it. Restoring that
draft blocks another save and links to My trips. Retrying requires explicit review
and confirmation. Definite pre-write rejection clears the marker; partial-save
IDs retain the recovery link. Success removes only the own key and suppresses late
autosave. This mitigates accidental retries; it is NOT database-backed exactly-once
or idempotency. Disabled/full storage shows a localized memory-only warning; do
not imply recovery after the page closes when persistence has failed.

Local verification:
- `npm run check` (behavior/routes/SQL regressions, TypeScript and build).
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/path/to/chromium node scripts/qa-auth-lifecycle.mjs`.
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/path/to/chromium node scripts/qa-planner-draft-isolation.mjs`.

The latter uses actual React Planner/Auth with synthetic Auth/APIs, TH/EN at
390/1440px. It covers A/B/guest isolation, explicit adoption, retained account
routines, owner assertion payloads, uncertainty across reload, confirmed retry,
late save/generation after switching, logout retention, legacy quarantine and
successful own-key cleanup. External requests are blocked. Real hosted OAuth,
cookie revocation, multi-account and Safari acceptance remain gated by #115/#120.
No hosted Auth, users, emails, SMTP, billing or database changes are made here.
