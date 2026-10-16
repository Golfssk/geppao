# Gebpao management-system REA: Agoda Partner Portal / Airbnb Hosting

## Confirmed target

The target is the **management experience**, not the consumer Agoda/Airbnb homepage or a copy of their search results. Two separate Gebpao roles must remain distinct:

1. **Platform Admin**: intake, duplicate decisions, evidence/media review, publication, data-quality checks and oversight.
2. **Business / property operator**: manage their own business, places, photos, details and submissions within membership permissions.

This management scope supersedes the narrower consumer-search and public Host landing research in `AGODA_PUBLIC_UX_RESEARCH.md` and `AIRBNB_HOST_UX_RESEARCH.md`. Those documents describe earlier work, not a completed authenticated dashboard redesign.

## Evidence and access boundary

Reviewed official public documentation on 2026-10-15:

- Agoda Partner Portal (YCS): Dashboard, Reservations, Calendar/rates/availability, Property, Finance, Settings/User Management and System Logs. The property area includes photos, rooms, details, location and policies. Source: [How do I use Partner Portal?](https://partnerhub.agoda.com/how-do-i-use-yield-control-system-ycs).
- Airbnb Hosting tools: Today, Calendar, Listings, Messages and Menu. Today prioritizes reservations/tasks; Listings groups property information/photos/amenities/arrival guidance; Calendar concerns availability and pricing. Source: [Exploring your hosting tools](https://www.airbnb.com/resources/hosting-homes/a/exploring-your-hosting-tools-738).

These are **documented product workflows**, not observations from authenticated Agoda/Airbnb accounts. No private backend, private API, host/customer record, credentials, payment data or platform source code was accessed. No third-party design assets or business catalogs were copied.

REA `rea-agents@6.4.0` was actually run against a source-only snapshot of **Gebpao's own Admin routes, Admin APIs/components and relevant Admin/intake libraries**:

```sh
npm --prefix tools/rea run rea -- analyze-javascript-application /absolute/path/to/source-only-snapshot --format json
```

- Evidence ID: `ev_2ffc4521442387aac209113ed9f5eb05be470cb6b5f7713a611fe0a3fa0da4f3`
- Source snapshot SHA-256: `491b978642467077ed1cf1ab356a53d8d9921b9c207526289f315ce387327c39`
- 34 source files parsed, zero parse failures and zero integrity contradictions; 292 graph nodes / 297 edges.
- AST findings are static relationships, **not vulnerabilities or proof of executed behavior**. The snapshot excludes environment files, dependencies, build artifacts, database records and cookies. Large raw reports remain outside Git.

REA was used for static structure discovery. Product comparisons are manual synthesis of the official sources above; server/component regressions and SQL/RLS tests provide separate behavioral evidence. No unsupported live REA browser connection or private Agoda/Airbnb reverse-engineering success is claimed.

## Workflow mapping and honest implementation status

| Reference pattern | Gebpao management adaptation | Current status / next boundary |
| --- | --- | --- |
| Airbnb Today / YCS Dashboard | Action-first Admin view: imports, pending moderation, missing data and evidence | Existing `/admin`, `/admin/imports`, `/admin/data-quality`; unified prioritization and a dashboard redesign are future work, not shipped here |
| Airbnb Listings / YCS Property | Business workspace for the operator; Admin review without silently overwriting owner-managed fields | Existing `/business/places/[id]/manage` and `/admin/places/[id]/curate`; this patch fixes owned-place review access |
| Property photos | Rights-evidenced upload, independent approval/revocation, explicit cover choice | Existing media API and approval gates; this patch exposes them on the owned-place review page and hides unsupported owner-file deletion |
| YCS User Management | Separate platform Admin from business membership and scoped mutations | Existing `getAdminContext`, membership checks and RLS stay authoritative; no new delegated-role UI or broad Admin owner-content write access |
| YCS System Logs | Source evidence and moderation auditability | Existing source/import records; a complete searchable immutable audit-log product is not implemented |
| Calendar / room types / rate plans | A separate accommodation inventory domain, not Place opening hours or reference-price rows | Not part of this patch; requires an agreed physical-unit vs room-type model, date inventory, rates, concurrency and authorized connectivity |
| Reservations / messages / earnings / Finance | Separate booking operations, messaging and money flows | Not implemented or inferred from listing data; no mock operational metrics or payouts presented as real |

Restaurants/cafes/attractions/activities share the Place/content workflow, but do not automatically inherit room inventory or lodging-specific controls. Pool villas remain accommodation data; Pool type/bedroom/bathroom fields are not a reservation engine.

## Two defects fixed in this patch

### 1. Accept / link rejected a valid nullable reason

The real queue sent `distinct_reason: null`; the route required any supplied value to be a string and returned 400 before the acceptance RPC. A shared request builder now defines the UI contract. The API accepts omitted/null/blank reasons for ordinary acceptance/linking, normalizes them to SQL NULL, and still rejects invalid types, IDs, overlong values and distinct overrides without a meaningful reason. SQL remains responsible for atomic duplicate rechecks and full reviewed-ID validation.

### 2. Owned Place review returned 404

The review page filtered `business_id IS NULL`, excluding every owner-managed Place even for an authorized Admin. The Admin-only read query now includes owned Places and selects `business_id`. Auth checks still run before any query; RLS remains enabled. Query failures are no longer disguised as missing Places.

For owned Places, the UI disables profile, accommodation details, hours and reference-price editing; media approval/revocation stays actionable. Existing server mutation endpoints keep their unclaimed-only restrictions. Deletion is only shown for Admin-uploaded media supported by the deletion API. This fixes review access **without granting the Admin a new owner-content overwrite workflow**.

## Delivery and next implementation sequence

This patch ships the two fixes and regressions. It does **not** deliver full Agoda/Airbnb feature parity or redesign all authenticated management screens.

Recommended subsequent slices, each with explicit acceptance criteria:

1. **Admin command center**: task queues, filters, detail/review navigation, actionable completeness and evidence states. No fabricated occupancy/revenue statistics.
2. **Business/property workspace**: guided profile → contacts/location → details → media → readiness/submission, with draft/pending/published/rejected recovery and role-aware actions.
3. **Access/audit UX**: membership management and accountable moderation history; verify effective permissions at API/RLS boundaries, not just hidden buttons.
4. **Accommodation operations**, only after the inventory/booking product scope is agreed: units/room types → availability/rate plans → reservations; integrate OTAs only through authorized methods. Keep content publishing independent of availability synchronization.

To validate workflows absent from public documentation, use an authorized demo account or owner-provided redacted screenshots of task flows. Never request passwords/OTPs or unredacted guest/payment records in chat. No hosted writes, account changes, migration application or PR merge were performed for this patch.
