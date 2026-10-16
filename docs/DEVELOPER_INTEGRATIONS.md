# Developer integrations

## Argos (connected)
Project: https://app.argos-ci.com/golfssk/geppao
Connected repository: Golfssk/geppao. GitHub checks enabled. Authentication: GitHub OIDC, with tokenless fallback for fork PRs. No `ARGOS_TOKEN` secret is required or committed.

`.github/workflows/argos.yml` runs on PRs, pushes to main and manual dispatch. Only its visual job can request an OIDC identity token. It checks out the tested revision, builds using dummy Supabase settings and captures public pages. It never uses `pull_request_target`, production credentials or signed-in/admin pages.

### Local run
```
npm ci
npx playwright install chromium
NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=ci-placeholder-key npm run build
npm run test:visual
```
For a development-server run: `VISUAL_USE_DEV=true npm run test:visual`.
Uploads are opt-in (`ARGOS_UPLOAD=true`, set only by the visual workflow). Generated screenshots/results are ignored. Don't add real account sessions, private pages or production environment values to this config.

### Coverage and stability
12 named screenshots: Thai/English × desktop/mobile × country/province/Pak Chong district. The suite also asserts 77 provinces, 32 Nakhon Ratchasima districts, five map points and no horizontal overflow. Reduced motion makes snapshots deterministic; motion behavior remains covered by the existing destinations motion unit tests.

External resources are blocked and terrain is toggled off **only in the tests**. External photography is replaced by a fixed solid-color SVG fixture. Thus these snapshots do not validate hillshade availability, third-party photos or the appearance of terrain-enabled maps. Add separately controlled fixtures to cover those later; do not hide a broken real integration by automatically accepting diffs.

### Baseline / review
The first build on main establishes the default-branch baseline. An initial PR without a baseline can show all screenshots as new. Review each screenshot in Argos and compare subsequent PRs against a main build. Do not automate acceptance of future visual changes. The workflow test job passing does not mean visual differences have been approved. Argos checks are not made required by this change; branch protection should only be updated once a baseline succeeds.

Hobby quota/limits apply. No paid upgrade is authorized. Cancel redundant runs or reduce screenshot coverage if the account reaches its limit.

## Shared agent context (prepared)
`AGENTS.md` provides project commands, data/security boundaries and map/localization rules. Compatible coding tools should read this file before editing.

## Other recommended tools (not claimed connected)
- **v0**: UI exploration only. Account/GitHub linking still needs a separate authorized session. Review generated changes in a branch; do not replace the app, auth or data layer.
- **Cursor OR Cline**: choose one local editor assistant on the developer's own machine. No unnecessary runtime dependency in this web app.
- **Lingo.dev**: deferred until a localization workflow is approved. Existing TH/EN copy and geographic names remain manually reviewed.
- **Tiptap**: deferred; adding an article editor is a product feature, not an account connection.
- **Vercel MCP**: reauthentication was requested during setup. Reconnect it in the integration settings before using MCP operations. Existing GitHub/Vercel deployments are not modified by this PR.

References: https://argos-ci.com/docs/quickstart/playwright-quickstart and https://argos-ci.com/docs/learn/integrations/github-actions-authentication

## Dependency audit at setup
`npm audit` reports an upstream `braces` stack-exhaustion advisory through the latest Argos SDK (`@argos-ci/playwright` → core → fast-glob → micromatch). No patched compatible braces release was offered at setup; do not apply the suggested downgrade to an obsolete SDK. This development-only path handles repository-controlled screenshot globs, not public user-supplied patterns. Track the upstream fix before accepting dynamic/untrusted patterns. Existing Next.js and source-map-js advisories also remain outside this scoped integration change and need a separate dependency-update PR. Do not claim this setup has a clean dependency audit.
