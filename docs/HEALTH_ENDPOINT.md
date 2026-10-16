# Public health endpoint

`GET /api/health` is a bounded anonymous availability probe, not a catalog dashboard or proof that all roles/RLS policies work.

- `200`: `status: ok`, environment/database checks true.
- `503`: `status: error`, `code: NOT_CONFIGURED`; or `status: degraded`, `code: DEPENDENCY_UNAVAILABLE`.
- Raw database/exception messages and exact catalog counts are no longer returned. No in-repository consumer relied on counts; external monitors should use HTTP status and `status`/`checks` instead.
- Three HEAD queries, each limited to one public row, use the anonymous key without caller cookies. Places/events are filtered to published rows. Empty readable tables are healthy.
- A three-second overall deadline aborts probes. Per-process single-flight and ten-second success/two-second failure cache reduce repeated database work. Responses remain private/no-store so CDN/browser caches cannot mask an outage.
- This is **not distributed rate limiting**; multiple instances each have their own cache. Hosting-native abuse controls and monitoring/alerts remain a separate gate. No new paid service is provisioned.
- No schema, Auth setting, RLS policy or live data mutation.

Validation: `npm run test:health` plus the full `npm run check` and hosted CI/Preview checks. Hosted role/Storage/recovery smoke tests still require an approved target and actors.
