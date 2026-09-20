# Phase 19 — Pilot Incident Workflow

## Severity

- **P0:** Privacy/security exposure, cross-user access, unpublished Local Data visible publicly, or destructive data loss. Stop the pilot immediately.
- **P1:** Trip cannot be created/saved, Planner returns invalid references, navigation is unusable, or Admin moderation is blocked.
- **P2:** Incorrect estimate, missing warning, analytics gap, mobile usability problem, or recoverable workflow failure.
- **P3:** Copy, visual polish, or non-blocking improvement.

## Required incident fields

- Date/time and environment.
- Reporter and pilot role.
- Route/API.
- Reproduction steps.
- Expected and actual behavior.
- Related Trip/Place/Event ID without secrets.
- Severity.
- Owner.
- Status: open, investigating, mitigated, resolved, accepted.

## Response rules

- P0: stop pilot, preserve evidence, revoke exposure if needed, and fix before resuming.
- P1: provide a workaround if safe and prioritize the next release.
- P2/P3: add to the optimization backlog with evidence.
- Never solve missing Local Data by inventing values.
- Never enable a paid API as an emergency workaround without explicit approval.
