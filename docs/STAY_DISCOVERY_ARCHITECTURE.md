# Stay discovery: UX and backend contract

## Implemented in this branch

1. `/stays`: server-rendered first page, shareable GET search context, TH/EN UI, amenity/verification/capacity/reference-price filters, stable 12-result pages, empty/error states and responsive lodging cards. Mobile filters are expandable. Validated locale middleware and a preference cookie keep the navigation and page language consistent on the first server-rendered paint.
2. `lib/stays/query.ts`: one parser for SSR and API; duplicate keys fail closed; bounded query, guests (1–30), page (1–500), decimal budget and allowlisted sort; real ISO date checks in Asia/Bangkok and up to 30 planning nights.
3. `GET /api/stays`: explicit 400 validation and 503 catalog failure; no-store response; no raw database errors returned to travelers.
4. `lib/stays/server.ts`: session anon/authenticated Supabase client, 8-second request timeout and managed-media URL allowlist. No service-role credentials.
5. Migration `028_public_stay_search.sql`: read-only `SECURITY INVOKER` function with fixed search_path, explicit role grants, literal text matching (no dynamic SQL), published-accommodation predicate, approved/active media predicate and targeted indexes. Existing RLS stays in force.
6. Accommodation detail under `/places/[slug]`: independent bilingual presentation; object/array-safe one-to-one detail relation, approved image gallery, known/unknown fact states, explicit price units, HTTPS/telephone link validation and Planner handoff. Generic Place and legacy Stay routes remain.
7. Planner deep links now initialize prompt and valid dates. A selected lodging reference is context, **not** a guarantee the Planner will select that stay; its existing hard constraints remain authoritative.
8. Optional pinned REA development package under `tools/rea`. No hosted REA service and no Supabase Edge Function were deployed.

## Search/pricing invariants

- Hard filters run in Postgres, not by downloading the entire catalog into the browser.
- Unknown amenity values never satisfy a checked hard filter.
- Capacity is `accommodation_details.maximum_guests`, a recorded property maximum. It does not mean available rooms, room-level occupancy or sellable inventory. Unchecked capacity filtering leaves unknown records discoverable.
- Headline/filter/sort price is the lowest recorded **THB/night** `price_items` amount. Person/group/room prices and other currencies never silently become a nightly headline. They remain visible with their original units on detail.
- Unknown nightly prices sort last and fail an explicit price cap. `is_estimate` remains visible.
- A price cap is a filter on a recorded starting price; taxes, rooms, nights, promotions, cancellation terms and total stay quotes are not calculated.
- Dates/guests persist in links and pass into Planner as context. No live availability claim, reservation, hold or payment occurs.
- Published catalog text retains the source language. TH/EN covers the new interface, not a full-site/content translation or multilingual full-text index.

## Deployment ordering / release gates

This PR intentionally does **not** modify Production.

1. Confirm a backup and compare live migration history with the immutable repository chain.
2. Run the complete existing migration chain plus `028` in a disposable staging Supabase project. Repository CI already has a clean-reset job; verify that job passes. The local PGlite tests do not prove the full existing migration chain applies.
3. Run `npm ci && npm run check` on Node 24.11+.
4. Deploy a Preview with staging URL/key; test real PostgREST RPC shape and table permissions for anon, traveler, business owner A/B and admin. PGlite tests cover synthetic anon/authenticated policies, not every production actor.
5. Confirm approved/active managed media is the only public media, including when the viewer is an authenticated owner/admin.
6. Configure gateway/CDN rate limits for public search and monitor timeout/error rates; the application does not implement a distributed per-client rate limiter. Check server-side `EXPLAIN (ANALYZE, BUFFERS)` with staging volumes and representative filters. Literal substring text search is intentionally simple for the current small catalog; the new index is not a claim of full-text/large-scale optimization.
7. Apply reviewed `028` through the normal migration process **before** deploying the app to its matching environment. If absent, `/stays` fails visibly with a retry state, not an invented empty catalog.
8. Keep a last-known-good application deployment. Rolling back the app leaves the additive read function/indexes harmless; do not rewrite applied migration history.

## Verification performed

- 33 automated tests: parser/date boundaries, locale context, link schemes, PostgREST relation shapes, SQL migration syntax/execution, literal search safety, fixed pagination, price units, hard filters, RPC bounds and synthetic RLS.
- Full migration manifest verification, TypeScript check and optimized Next.js production build.
- Local UI flow tests at 1440px and 390px with clearly marked synthetic, non-bookable data: initial results, next page, apply filters, property detail, check-in/out facts, Planner prefill, locale switch, empty/invalid states, API 400/no-store and horizontal-overflow/page-error checks.
- Automated axe WCAG 2 A/AA and 2.1 AA audits on new search/detail in both languages and viewport sizes; results recorded after fixes.
- Visual inspection of rendered local previews. This is not a full assistive-technology audit or hosted production smoke test.

## Production security observations (read-only inspection)

Supabase reported RLS enabled on the public tables inspected. Advisors also warned that:

- Leaked-password protection is disabled. Review enabling it through normal Auth administration: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
- Some public/authenticated SECURITY DEFINER RPCs are executable by their intended roles. This alone does not prove a vulnerability; review internal auth/token checks and grants against `TECHNICAL_HARDENING_RUNBOOK.md`. Do not blindly revoke trip sharing, analytics or owner/admin helpers.
  - https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable
  - https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable

No Auth setting, policy, existing RPC, migration history or production data was changed in this work. Existing main-application npm audit notices are not remediated by the UX change; treat dependency security as a separate reviewed release gate.

## Future reservation backend — not implemented

Before claiming OTA-like booking, introduce a separate verified operator/inventory source, property → room type → rate plan → daily inventory/rate calendar, occupancy and cancellation rules, quote expiry, taxes/currency provenance, transactional holds, idempotent reservation/payment transitions and append-only audit/reconciliation. Room/night uniqueness and locking must prevent overselling; authenticated partner changes must be scoped by ownership and tested under RLS.

Do not add a “Book now”, “free cancellation”, live discount, room count, star/review score or sold-out badge until its source and backend contract exist. External inventory would require a separately authorized integration, not scraping Agoda.
