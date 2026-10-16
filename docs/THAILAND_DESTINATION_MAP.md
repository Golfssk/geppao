# Thailand destination explorer (/go)

## Scope

Replaces the four-card /go directory with a province-first, bilingual interactive Thailand map. No database schema, RLS, API, booking, payment, geolocation or admin changes. Existing /go/[slug] guides remain intact. No map SDK, API key or tile service is required.

- 77 province polygons and province-interior display pins.
- Mouse hover previews a province; leaving the map restores the clicked selection. Click/tap commits the selection.
- Six regional views, whole-country reset, native province selector and searchable list (Thai/English province and landmark names).
- Regional pin/label sizing is compensated for viewBox zoom. SVG clipping prevents off-map geography from covering toolbar controls.
- Responsive side panel on desktop and stacked panel on mobile. Reduced-motion support and native select/list keyboard alternatives. List selection remains in list view to avoid accidental map hover replacing a choice.
- Featured starting points: Pak Chong / Khao Yai, Khun Dan Prakan Chon Dam and Erawan Waterfall.

## Content and geographic boundaries

`lib/destinations/provinces.json` contains editorial landmark suggestions, not verified public Place records. Regions are discovery groupings, not an assertion of a single official regional classification. Markers identify provinces, NOT precise landmark coordinates. The illustration is not for navigation or authoritative boundary decisions.

Geographic shapes are derived from geoBoundaries gbOpen THA ADM1, represented year 2017, 77 units, source boundary ID THA-ADM1-36821470. © OpenStreetMap contributors; ODbL-1.0. Pinned upstream source, derivation description and reuse terms are in `public/maps/THAILAND_MAP_LICENSE.md`. The complete derived geographic database is offered at `/maps/thailand-provinces.json` under ODbL. The public copy must remain byte-identical to `lib/destinations/thailand-shapes.json` (tested).

Photos reuse the existing editorial catalog, plus the Erawan photograph by Lolavies (CC BY-SA 3.0). Source, author, license and cropping credit are visible per photo. Provinces without sourced photographs use a deliberate typographic treatment; failed image loading also falls back to this treatment. No fabricated imagery, availability or rates.

## Honest onward navigation

Province CTA uses the existing unified text search with the Thai province name and current locale; it does not invent database destination IDs. Search only returns published records, so some provinces may have no catalog results. Only the four existing guide slugs are linked. Khao Yai has the existing Planner-ready indicator; other guides stay marked in preparation. A landmark suggestion is not a claim that a guide, reservation or route is ready.

## Verification

- Eight destination tests cover completeness, IDs, bilingual content, requested landmarks, regional bounds, filters, onward query, interaction alternatives and ODbL/public-database parity. Included in `npm run check`.
- Local regression: 186 tests across stays, Host, admin, intake, unified search and destinations; migration manifest verification and TypeScript passed.
- Local browser checks: 1440px desktop and 390px touch mobile; actual pointer hover/leave, persistent pin click, touchscreen pin tap, region changes, list selection/search/empty state, locale and image-error fallback. No page errors or horizontal overflow observed.
- axe WCAG 2.0/2.1 A/AA: no violations found in eight desktop/mobile × TH/EN × map/list combinations. This is automated checking, not a full accessibility certification.
- Visual inspection of full-country, regional, photo, typographic, list and empty states. Full-country silhouette fits above mobile bottom navigation at 390×844.
- Local optimized webpack build is used because this isolated worktree shares dependencies through a symlink; normal CI `npm run check` remains the release gate.

## Release boundary

Preview / draft PR first. Do not merge or promote this feature without the user's review. No production migration is necessary.
