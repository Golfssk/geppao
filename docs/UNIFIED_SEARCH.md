# One catalog search for Gebpao

## Product behavior

`/search` is the single search destination for restaurants, cafes, stays (including Pool villas), attractions, activities and Events. The category dropdown defaults to **All**. The layout adopts the supplied reference's clear category/query/destination/search grouping, with Gebpao's own styling and no copied Traveloka assets or branding.

- The desktop navigation has one Search entry, not separate Explore and Stays entries. Mobile retains one Search entry.
- `/stays` is a backward-compatible redirect to `/search?type=accommodation`, preserving allowlisted keywords, destination, language, dates, guests, filters, sort and page. It cannot redirect to another origin or accept a type override.
- Selecting Stays reveals the existing planning and lodging filters inside the **same form**. Changing to another category disables/hides those controls so stale nightly-price/capacity/date options cannot filter restaurants or activities.
- Dates are planning context, not availability or date-specific pricing. Capacity filtering is opt-in, refers to property capacity and is not room inventory. Only stays support nightly-price filters/sorting; unlike units are never compared across categories.
- Shared filters use recorded facts. Unknown amenities do not match. Events have no recorded amenity fields and therefore do not match amenity filters; the UI explains this.
- The submitted URL is the source of truth: refresh, category/query links, pagination and Place detail/back links preserve validated search context. There is no second standalone stay-search UI on `/stays`; demo-only stay routes remain isolated.
- Errors display an explicit unavailable/invalid state, not a fabricated zero count. Missing prices/images stay unknown rather than becoming free prices or copied stock listing photos.

## Read model

Migration `031_unified_public_search.sql` adds `search_public_catalog`. It is `SECURITY INVOKER` with a fixed search path, executable by anon/authenticated sessions. The server uses the session client, never a service-role search client.

The RPC returns a global total and deterministic 12-result pages across published Places and Events. Filters run **before** pagination; this is not a client-side filter over a silently capped catalog download. Text is a literal substring of name/description/address/destination, not dynamic SQL or a PostgREST grammar fragment. Page, category, query, numeric and sort inputs are bounded in both the query parser and the SQL function.

Secondary categories are searched without duplicating a Place in All. Lodging-specific filters only apply to a primary accommodation record, not an arbitrary Place tagged secondarily as accommodation. Cards retain the record's actual primary category.

Even if an authenticated owner can read their Draft through RLS, the RPC explicitly requires `publication_status='published'` on both entity types. Image selection explicitly requires approval, active takedown state and unexpired rights; the app then accepts only the configured project's managed media origin. No raw source evidence is returned.

Stay headline prices remain THB/night. Other results display a recorded THB reference price with its original supported unit, not a cross-category "cheapest" ranking. The Event timestamp is the earliest scheduled, non-ended instance, not a cancelled/completed one. Historical Events without an upcoming instance may still appear as published catalog entries without a fabricated date.

The previous `search_public_stays` API/RPC is retained for compatibility. No Google Maps scraping, availability synchronization, reservations, payments, ranking or new public business data is added.

## Delivery / release

This is stacked on the unmerged Place-intake branch because secondary-category search requires migration 030. Review/merge the foundation first, then retarget this change to main as appropriate; do not merge/promote automatically. Historical migrations 001–030 are unchanged, and 031 has not been applied to any hosted database.

Before hosted rollout, complete `STAGING_READINESS.md`. The inspected live target lacks both the previous stay-search and intake prerequisites, and Preview's DB binding could not be verified. Until migrations are installed on the correct isolated target, the new page should display an unavailable state rather than pretending a Preview build proves working live search.

## Verification record

The `test:search` suite exercises actual source and SQL: all seven categories, mixed global pages, secondary categories, published-only reads even for broader owner sessions, unknown facts, nightly price/capacity semantics, literal input, direct-RPC validation, Event units/schedules, media approval/expiry/takedown, URL round trips, legacy redirects and rendered form/error/empty/pagination states.

Full `npm run check`, real local browser interaction, desktop/mobile visual inspection and accessibility results are recorded below after execution. Local fixtures are labeled synthetic and never inserted into a hosted database.

### Completed local verification

- `npm run check`: **163 passed, zero failed** (37 stay, 4 Host, 67 intake/security, 55 unified-search regressions). Migration manifest verifies 31 ordered migrations; historical 001–030 unchanged. TypeScript and production build passed.
- Browser at 1440px desktop and 390px mobile, using an anonymous loopback Supabase test double backed by real search SQL and synthetic fixtures. Tested category submission, stay-field enable/disable behavior, no stale lodging filters in a cafe request, global pagination and refresh, legacy `/stays` redirect/context, empty and simulated-unavailable states, and English presentation. No real data or contacts were created.
- Twelve search-state accessibility audits (`main`, WCAG 2 A/AA and 2.1 AA tags) reported zero detected violations; no horizontal overflow or page errors. This is automated scope-limited testing, not a WCAG certification or hosted role test.
- Desktop/mobile images were visually inspected. Font-dependent search/Planner icons found during review were replaced with code-native SVG; secondary-category matches are labeled; empty-state and media placeholders do not imply real business data or photo rights.
- `git diff --check` passed. Raw screenshots, HTML captures, test doubles and REA reports stay outside Git.
