# Admin management UX — phase 1

## Scope

A dedicated administrative workspace for GepPao. This is not a copy of a private Airbnb or Agoda dashboard.

- `/admin`: work overview with exact pending-place, pending-event, new-contact and published-place counts; five oldest-updated pending records. A failed count is unavailable, not zero.
- `/admin/places`: a separate place queue; pending by default, oldest update first. URL-based name, publication status, place type and update-order filters, 20 records per page and exact filtered counts. Names are literal substring searches (SQL wildcard characters escaped), limited to 100 characters. Page is bounded to 1–1000; narrow filters for larger result sets.
- Dedicated navigation: overview, places, events, data quality, contact inbox, articles/news, analytics. Traveller navigation/footer/bottom bar do not overlap the administrative workspace. The redundant Admin account button is omitted inside the admin area.
- Thai/English copy for the new shell, overview, place queue and place moderation controls. Existing Events, Data quality, Contacts, Articles, Analytics and detailed curation editors retain their existing workflows and copy; they are not fully redesigned or translated in this phase.
- Existing team-owned curation editor stays linked. Business-owned records do not link to that editor because its server query intentionally permits only `business_id is null`.

## REA evidence and reference boundaries

Actual REA operations performed for this phase:

1. `analyze-javascript-application` over a source-only snapshot of the existing admin routes, moderation API, administrative components and access helper. Parsed 28 JavaScript/TypeScript files with zero parse failures; 29 relevant files. Evidence ID: `ev_f916d41070e02885d8841066ea612b14ce5bf18a1dfea690c016d1c784e5bbb4`.
2. `inspect-web-network-capture` over the previously recorded, redacted public main-document request for <https://www.airbnb.com/host/homes>. One retained document request, evidence ID: `ev_726f7478e9b4df057c99671adce7cdccd98a5ac898342d1b1e5ed5da417b725e`. This is historical public reference evidence, not a new live capture and not proof of private dashboard behavior.

The public Host experience informed a clear entry point, staged management tasks, short explanations and explicit next actions. The detailed admin information architecture was designed for GepPao's existing code and moderation workflow. No private Airbnb/Agoda access, source extraction, brand assets, listings, prices, reviews or earnings promises were copied. REA is development tooling only; no runtime dependency was added. Raw captures, reports, cookies and account data are not included in the repository.

Observed local problems addressed: a 50-record mixed-status feed without search/pagination; loaded-row count presented like a whole queue count; missing editorial navigation; immediate moderation controls; and a second navigation layer competing with traveller chrome.

## Authorization and mutation invariants

- Server layout adds a role boundary; individual page and API checks remain in place. Real admin pages are not made public. No service-role key, auth policy, membership, RPC, migration or table schema is changed.
- All real decisions still POST to `/api/admin/places/{id}/moderate`, which checks the signed-in user and existing `admin_users` membership, then calls the original `moderate_place` RPC.
- Approval, rejection and archive require explicit inline confirmation. Rejection requires a non-empty note. Fetch/HTTP/JSON failures are surfaced and controls unlock in `finally`.
- **Current RPC approval also marks information verified.** The UI describes that existing coupled behavior; it does not claim approval leaves verification unchanged. Quality gates and moderation logs remain server-owned.
- No bulk publish, delete, actual moderation, production data write, production migration or deployment setting change was performed as part of implementation/testing.

## Preview walkthrough

On Vercel **Preview** or local development only:

- `/demo/admin?lang=th` or `?lang=en`
- `/demo/admin/places?lang=th` or `?lang=en`

Fixtures are explicit `DEMO` records, fictional businesses and addresses. There are 28 synthetic records, including 22 pending places, so pagination can be exercised. Event/contact numbers are illustrative, not operational counts. Unsupported demo sections are non-interactive and labeled. Moderation simulation returns before any network request. It displays a simulation result and deliberately does not persist or change the fixture's status.

A request-level Proxy guard returns HTTP 404 before any asynchronous layout can stream a soft 404 when `VERCEL_ENV=production` and `NODE_ENV=production`, with noindex/nofollow headers. Layouts also retain a not-found guard and noindex/nofollow metadata. Demo code never imports a production repository. Root website chrome may read the current signed-in account as before; fixture pages themselves perform no database queries.

## QA

- `npm run test:admin`: bounded filters, wildcard escaping, filter-preserving pagination, coherent demo pagination, no-network demo actions, required rejection note, unchanged real API payload, server/network failures, role-boundary source regressions and navigation focus.
- Browser checks use only a localhost synthetic Supabase stand-in, fake test sessions and mocked moderation responses. They do not prove production database deployment, RLS configuration or data quality.
- Desktop 1440 px and mobile 390 px: overview, queue, confirmation, cancellation, rejection simulation, empty results, pagination, expanded mobile navigation; authenticated mobile header, count-unavailable state and failed moderation recovery also checked. A mobile signed-in-header overflow was found and corrected by removing the duplicate Admin button and allowing workspace-header wrapping.
- Automated WCAG A/AA axe checks on the new overview/queue at both sizes and the authenticated mobile overview found no violations. This is not a comprehensive accessibility certification.
- No screenshots containing real customer/contact data are used for QA.

Validation run: `npm run check` passed migration-manifest verification, 37 stays tests, 4 Host tests, 14 admin tests, TypeScript and the optimized Next.js build. The production-mode boundary is also tested against a local optimized build. Production Supabase data and deployments were not used.

Production-boundary result after adding the pre-stream Proxy guard: both `/demo/admin` and `/demo/admin/places` returned HTTP 404 with `X-Robots-Tag: noindex, nofollow`; anonymous moderation returned HTTP 401.
