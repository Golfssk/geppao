# Phase 17 Manual QA Checklist

Run this checklist once against a deployed Preview or Production environment after PR #18 is available.

## Access and authorization

- [ ] Owner opens `/trips/[id]` and clicks `คำนวณ Trip ใหม่`; request succeeds.
- [ ] Editor opens the same Trip and recalculates; request succeeds.
- [ ] Viewer can read the Trip but recalculation returns `403`.
- [ ] Unauthenticated request to `POST /api/trips/[id]/recalculate` returns `401`.
- [ ] A user without Trip membership cannot read or recalculate the Trip.

## Calculation behavior

- [ ] Day summary shows validation status, estimated cost, distance, and travel minutes.
- [ ] Route segments use an `estimate` label and do not claim Google Maps travel time.
- [ ] An item without coordinates shows a warning and does not create a false route segment.
- [ ] An item without a price shows a missing-price warning and is not represented as a confirmed zero price.
- [ ] An estimated price shows an estimated-price warning.
- [ ] A Place closed by recurring or special hours produces a conflict.
- [ ] An Event without a scheduled, available round on the service date produces a conflict.
- [ ] Overlapping item times produce a conflict.
- [ ] Travel time that arrives after the next item's start produces a conflict.
- [ ] Missing item schedule time produces a warning instead of an invented time.

## Trip safety

- [ ] Recalculation does not delete Trip Items.
- [ ] Recalculation does not change item order.
- [ ] A Locked Item remains present and locked after recalculation.
- [ ] Only Published Place/Event data is used by the calculation response.
- [ ] Google Maps navigation continues to work after recalculation.
- [ ] Refreshing the page preserves calculated fields and warnings.

## Release evidence

Record the environment URL, Trip ID used, timestamp, and pass/fail result for each section. Do not mark PR #18 ready until all critical authorization and data-safety checks pass.
