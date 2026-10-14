# Database-independent stay demo

## Purpose and status

For reviewing PR #90 before merge, `/demo/stays` and `/demo/stays/[slug]` reuse the lodging UI with synthetic fixtures. These routes are allowed only in Vercel Preview or local development and return 404 in production. Robots metadata is `noindex,nofollow`.

This is a **UX demo**, not a live-data staging database and not proof of real PostgREST/RLS, availability, payment or production readiness.

## What can be tried

- TH/EN switch, desktop/mobile layouts and explicit Demo notices.
- Literal property-name search (try Garden, Forest or Valley), destination, amenity, verification/capacity and synthetic price filters.
- Stable 12-item pagination across 18 explicitly labeled fictional properties.
- Detail facts and fictional price ranges; no external photos, real contact data or fabricated reviews.
- Planner handoff preview expands locally with prompt/date context. It does **not** call the Planner API, save a trip or emit product analytics. Regular production-detail behavior is unchanged.

Demo fixtures live exclusively in `lib/demo/stays.ts`. The production search repository and RPC never fall back to these fixtures. New demo pages do not read or write the Supabase business catalog. The existing global app shell still handles its normal authentication/session state.

## Actual staging blockers observed

- A Supabase branch creation request was rejected with `PaymentRequiredException`: branching requires Pro or above. No branch ID was returned and no branch was created. The quoted branch rate was US$0.01344/hour; no upgrade was performed.
- Vercel MCP connected, but project environment/deployment read requests returned 403 for scope `golfssks-projects`. The authenticated account could not access that project through this connection. No Vercel environment values were decrypted, changed or copied, and no project protection settings were weakened.
- No migration, production-data mutation, merge or production deployment was performed during demo setup.

Real database staging still requires an approved compatible Supabase environment and authorized access to the Vercel Preview project settings. Do not apply migration 028 to production just to make a demo render.

## Verification

- `npm run check`: all 37 tests (33 existing + 4 demo isolation/filter tests), migration manifest, TypeScript and optimized build passed locally.
- Local Chromium: TH/EN, filters, pagination, dates, detail and isolated Planner-handoff preview passed at 1440px/390px; no browser page errors, horizontal page overflow or API POST requests during demo flow tests.
- Eight axe audits: search/detail × TH/EN × desktop/mobile, no detected WCAG 2 A/AA or 2.1 AA violations.
- Rendered screenshots visually inspected; clearly labeled synthetic records, no hidden real-data fallback.
- Hosted Vercel Preview deployment and CI must be checked after this commit; these local checks do not claim a completed live-staging smoke test.
