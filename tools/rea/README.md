# REA development tooling

Pinned upstream: `morluto/rea`, npm `rea-agents@6.4.0` (MIT; external tools have separate licenses).

REA is a **developer CLI/local stdio MCP**, not a traveler feature, web runtime dependency, hosted API, or Supabase Edge Function. This package stays outside the main application's dependency graph.

## Setup

Use Node 24.11+ (the repository now pins the Node 24 line):

```sh
npm --prefix tools/rea ci --ignore-scripts
npm --prefix tools/rea run rea -- --help
npm --prefix tools/rea run doctor
```

`--ignore-scripts` is intentional for static/web development; it does not provision native providers or enable Frida runtime instrumentation. Follow upstream guides and review installation effects before enabling native analysis. Do not run an unattended `rea setup` against a developer's agent configuration.

A local MCP-compatible agent can launch the pinned CLI with `npx -y rea-agents@6.4.0 --mcp`, or the installed `tools/rea/node_modules/.bin/rea --mcp`. Configuration syntax depends on that agent. This does **not** connect a local stdio server to Notion chat, whose remote MCP connection requires a supported hosted endpoint.

## Safe investigation boundaries

- Analyze only software you own or are authorized to examine.
- For Agoda, observe public rendered pages and ordinary user flows only. Do not bypass protection, use private APIs, scrape bulk catalog data, or copy branding, photographs, reviews, prices, source code, or private credentials into GepPao.
- Do not expose REA or a generic command-execution endpoint on the public web.
- Keep evidence, screenshots, cookies and network captures outside Git. They can contain third-party material or secrets.
- REA browser commands require an explicitly configured **loopback CDP HTTP endpoint** and an exact origin allowlist. The remote chat browser endpoint was not compatible; no local browser MCP registration was fabricated.

Inspect a passive public page in a supported local setup:

```sh
npm --prefix tools/rea run rea -- list-browser-targets http://127.0.0.1:9222 --allowed-origins '["https://www.agoda.com"]'
# Use an actual returned target ID; do not guess it.
npm --prefix tools/rea run rea -- inspect-web-page http://127.0.0.1:9222 ACTUAL_TARGET_ID --allowed-origins '["https://www.agoda.com"]'
```

Use a source-only working copy for static analysis; including `node_modules` or `.next` produces a much larger dependency/bundle investigation rather than a useful app-only report:

```sh
npm --prefix tools/rea run rea -- analyze-javascript-application /absolute/path/to/source-only-copy --format json
```

No REA output is automatically treated as authoritative business logic or permission to run target code. Findings must be reviewed against source and tests.
