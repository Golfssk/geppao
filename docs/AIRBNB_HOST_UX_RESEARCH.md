# Airbnb public Host UX → GepPao Host preparation

## Source and evidence boundary

Reviewed the public pages:

- https://www.airbnb.com/host/homes — prominent entry CTA, earnings-estimator hero, support/resources, FAQ and protection messaging.
- https://www.airbnb.com/resources/hosting-homes/a/how-to-get-started-on-airbnb-3 — three groups: tell us about your place; photos/title/description/amenities; pricing and publication.

The shared browser inspected the rendered public Host landing. No Airbnb login, listing creation, private host dashboard, private API investigation, application submission or booking was performed. No Airbnb photos, listings, prices, insurance terms, trademarks, source code or reviews were copied into GepPao.

REA 6.4.0 was actually run for this investigation:

1. `inspect-web-network-capture` on a real browser-recorded HAR, reduced to **one public main-document GET response**. Cookies and authentication headers were removed before analysis. REA evidence ID: `ev_726f7478e9b4df057c99671adce7cdccd98a5ac898342d1b1e5ed5da417b725e`.
2. `analyze-javascript-application` on an inert source-only snapshot of GepPao's existing Host/Business routes and components. No `.env`, dependencies or database records included. 49 JavaScript/TypeScript sources parsed; zero parse failures. Evidence ID: `ev_48246bbaa17ed6fae6d56ecdfe956ab91d793907e1ca850af4e6281e590ea513`.

Raw captures, third-party material and large REA reports stay outside Git. REA's browser commands require a loopback CDP HTTP endpoint; the remote shared browser does not satisfy that requirement. The HAR analysis is **retained producer evidence**, not live CDP scenario provenance. Static source analysis is **derived evidence**, not proof of runtime behavior. Public UX observations and manually reviewed GepPao code—not an invented Airbnb backend reconstruction—ground the changes.

## Adopted patterns, with independent implementation

| Public pattern | GepPao adaptation |
| --- | --- |
| Clear entry action and reassurance | TH/EN Host landing; preparation CTA; existing account/workspace link; clearly scoped Early Access terms |
| Explain listing setup in stages | Public preparation: place basics → photos/details → readiness review |
| Help owners understand requirements | Optional, in-memory checklist; unknown facts remain unknown; no personal data fields |
| Review before publication | Existing Business workflow: authenticated profile → Places form → draft → pending review → published after approval |
| FAQ and help access | Original FAQ about fees, real current scope, photo rights, review and reference pricing; existing Contact route |

Not adopted: Airbnb earnings estimates, comparable nightly rates, AirCover/insurance, co-host payouts, reservation calendars, payment handling, ratings or booking guarantees. GepPao does not have the verified data or contracts to promise those features.

## Implemented scope

- `/host`: independently designed, bilingual landing and FAQ. No anonymous financial claims.
- `/host/start`: three-stage preparation checklist. Choices exist only in React memory and reset on reload; they do not create an account, validate ownership, save a draft or submit a listing.
- Primary handoff: `/host/login?next=/business/onboarding&lang=...` (URL encoded); existing onboarding sends accounts with a business to their workspace and new business profiles to the existing Places form.
- Manage handoff: existing authenticated `/business/places` route.
- Home Host CTA now enters preparation rather than only the contact form.
- `/host/start` uses a focused shell without the traveller navigation or large footer; language/account controls, a Host back link and Contact/Privacy/Terms links remain available. Other routes keep their existing navigation.
- Existing authentication, ownership/membership checks, mutation APIs, RLS, legacy listing routes and database schema are unchanged.

The authenticated Business profile, full Place editor, media uploader, pricing editor, rejection recovery and Host dashboard have **not** been redesigned in this stage. Their existing APIs and review rules remain authoritative; this is not Airbnb feature parity or a new reservation backend.

## Verification and release

`test:host` checks known-item counts, allowlisted auth handoff routes, complete TH/EN labels and absence of mutation/persistence code in public preparation. It runs in `npm run check` alongside the existing stay tests.

Preview UI QA must cover: TH/EN at desktop/mobile, FAQ expansion, all three preparation steps, back navigation, retained choices, refresh reset, zero API writes and the existing sign-in handoff. Test against a local anonymous stub; do not create real business profiles or listings merely to test the public preparation.

This branch remains subject to the PR's existing live-staging/migration release gates. No merge, production migration, account changes, paid-plan upgrade or insurance/booking integration is authorized by this UI work.

### Verification completed for this change

- `npm run check` passed: 37 existing stay tests + 4 new Host tests, immutable migration manifest, TypeScript and optimized production build. No dependency changes.
- Local Chromium with an anonymous stub: `/host` and `/host/start`, TH/EN at 1440px/390px; eight axe WCAG 2 A/AA + 2.1 AA audits reported no detected violations.
- Tested FAQ expansion, all preparation steps, retained choices when going back, reset on refresh, route-specific focused navigation and the existing sign-in handoff. No page errors, horizontal overflow or API writes.
- Rendered screenshots of landing, preparation and FAQ/checklist/review states were visually inspected. A development indicator appears only in local dev screenshots; it is not a GepPao control.
- Existing Home news placement/navigation regression checks passed.
- No authenticated business creation, hosted ownership/RLS smoke test or production write was performed.
