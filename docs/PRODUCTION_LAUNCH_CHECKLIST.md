# GepPao production launch checklist

## Release gate

- [ ] Main branch deployment is ready and production domain is verified.
- [ ] Public preview has been checked at 375, 480, 768, 1024, and 1440 px.
- [ ] Keyboard navigation, visible focus, skip navigation, forms, and reduced-motion behavior have been checked on traveler and operations flows.
- [ ] No mobile navigation or fixed-action overlap blocks primary actions.

## Catalog and planner readiness

- [ ] Every published Planner candidate has a verified coordinate, description, recommended duration, price decision, and required opening hours.
- [ ] Price rows come from an official or otherwise documented source; estimates are marked as estimates.
- [ ] Event schedules are current and published only when the date, time, venue, and status are verified.
- [ ] Demo catalog records and mock media are removed, archived, or prominently disclosed before public launch.
- [ ] Planner is tested with representative one-day and overnight trips, including budget, hours, and route-conflict cases.

## Access and security

- [x] RLS is enabled on public tables that previously lacked it.
- [x] Policies exist for destinations, leads, listing images, place sources, and signed-in trip sessions.
- [ ] Review public RPC functions. Keep anonymous execution only for `get_shared_trip` and `track_product_event` after validating their input controls.
- [ ] Review authenticated RPC functions and retain execution only where the relevant user flow needs it.
- [ ] Enable leaked-password protection in Supabase Auth.
- [ ] Verify admin, business editor, signed-in traveler, anonymous visitor, and denied-user test cases.
- [ ] Rotate or confirm publishable-key and server-secret handling; never expose service-role credentials in the browser.

## Operations

- [ ] Confirm Admin review and Business editing work under RLS.
- [ ] Confirm lead submission succeeds while public reads remain blocked.
- [ ] Confirm active destinations and published catalog content remain visible to public visitors.
- [ ] Confirm analytics records are accepted only through the controlled tracking function.
- [ ] Capture final security and performance advisor results.

## Go/no-go

Launch only when each applicable item above is checked, critical security advisories are resolved or explicitly accepted with an owner and expiry, and the production smoke test passes.
