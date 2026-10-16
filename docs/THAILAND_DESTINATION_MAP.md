# Thailand destination explorer (/go)

## Scope

Replaces the four-card /go directory with a province-first, bilingual interactive Thailand map. No database schema, RLS, API, booking, payment, geolocation or admin changes. Existing /go/[slug] guides remain intact. No map SDK or API key is required. The country and district vectors are local; optional province hillshade uses an external public Esri tile service.

- 77 province polygons and province-interior display pins.
- Mouse hover previews a province; leaving the map restores the clicked selection. Click/tap now opens the province drill-down.
- Six regional views, whole-country reset, native province selector and searchable list (Thai/English province and landmark names).
- Regional pin/label sizing is compensated for viewBox zoom. SVG clipping prevents off-map geography from covering toolbar controls.
- Responsive side panel on desktop and stacked panel on mobile. Reduced-motion support and native select/list keyboard alternatives. List selection opens the same province drill-down; hover never opens it.
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

## Province drill-down

Click/tap a province polygon or pin, native province choice, list item or featured card to open its district map. Back to Thailand restores the country explorer. Province changes remount the drill-down, abort obsolete fetches and reset local zoom/selection. One province JSON is fetched on demand and cached in memory, not all 77 upfront.

- 77 local province files with 928 district-level units, including Bangkok's 50 khet. This is the represented **2019** geoBoundaries ADM2 snapshot (THA-ADM2-78962969), not a claim of current official legal boundaries. District source: Royal Thai Survey Department / OCHA ROAP, CC BY 3.0 IGO. Thai names use the MIT-licensed Kongvut table with explicit corrections of known English-name aliases.
- Fit-province view, district click/native select, selected-district highlight, zoom buttons (1–4×), fit reset and collision-reduced labels. Geographic shapes and hillshade use the same normalized Web Mercator projection. No drag/pinch or 3D terrain is claimed.
- 263 sourced OSM map points across 65 provinces, capped at 12 per province. Twelve provinces have no points in this source collection and show an honest empty state while all districts remain selectable. Coverage is not a complete national POI inventory.
- Numbered map points and accessible list choices open source details and zoom to the point. Area-centre coordinates are explicitly marked as approximate centres, not entrances. Khun Dan dam and Erawan waterfall use separately checked OSM coordinates. The Khao Yai visitor-centre coordinate falls in the Nakhon Nayok district geometry; it is not forced into Nakhon Ratchasima.
- Optional **2D hillshade**, not 3D, from Esri World Hillshade, clipped to the province district union. Tile selection is bounded (at most 20 fit-view tiles); zoom does not request an unbounded tile pyramid. Toggle off removes raster requests; failed tiles show status and an all-failed raster layer disappears while district exploration remains usable. No account, key or paid plan was created. Provider terms, availability and production traffic limits must be reviewed before high-volume launch.
- Full provenance and distinct licenses: `/maps/PROVINCE_MAP_LICENSE.md`, Thai name MIT notice, per-province ODbL derived-point collections and downloadable `/maps/provinces/index.json`. Generator: `scripts/build-province-maps.py` with explicit input file arguments. No raw research caches or credentials are committed.

### Drill-down validation

- Eight new pure/data tests (16 destination tests total); 194 regression tests pass across all suites. Migration-manifest verification and TypeScript pass.
- Real mouse and touch province-pin activation, SVG district click, district selector, place choice/source precision, zoom/reset, terrain off, back navigation, province switch, data-fetch failure/retry and all-terrain-failed fallback checked locally.
- axe WCAG 2/2.1 A/AA: no violations in eight TH/EN × desktop/mobile × dense Bangkok/empty-points province states. No horizontal overflow or page exceptions observed in those checks; automated checking is not certification.
- Desktop province-fit, selected Pak Chong, Nakhon Nayok terrain and actual mobile viewport visually inspected. Full-page mobile browser screenshots can misplace sticky chrome, so actual viewport capture was checked separately.
- Optional terrain is an external network dependency; the local boundary and point files remain usable without it. No production database writes or migrations.

## Smooth country-to-province camera

Province activation in map view now keeps the existing SVG mounted during a 720ms cubic ease-in/out camera flight toward the clicked province bounds, fitted to the actual desktop/mobile map viewport. The viewBox is updated directly through requestAnimationFrame, avoiding a React rerender of all province paths on every frame. Expensive SVG shadow and distracting pins/labels are suppressed only during the flight; the district view then reveals over 240ms.

Only the clicked province is preloaded in parallel. A new selection cancels the prior frame loop; changing map/list/region restores the overview camera and cancels pending navigation. Unmount cleanup cancels frames. Hover never navigates, and map activation no longer triggers the old abrupt scroll-to-section. List/featured choices retain intentional scroll-to-panel behavior. Reduced-motion preference skips both the camera flight and reveal animation. No geographic/source/database changes.

Three motion tests cover fit, easing/endpoints and integration safeguards (197 regression tests total). Browser checks verified intermediate camera frames on desktop and touch mobile, final target, no overflow/page errors, reduced-motion instant navigation, cancel/restore and latest-selection-wins behavior. Mid-flight, final desktop and mobile views were visually inspected.

### Owner-approved Pak Chong refinement

Korat / Pak Chong–Khao Yai belongs to **Northeast / ตะวันออกเฉียงเหนือ**.
The owner corrected the earlier East grouping; the Thai Northeast label is now
ตะวันออกเฉียงเหนือ rather than อีสาน. Other provinces are unchanged. Curated source-coordinate
slots live in `lib/destinations/curated-places.json` and are applied by the map
builder after automatic selection. Slot 3 identifies the park's northern
checkpoint, slot 4 an OSM-mapped spring; see the public license notes for naming
and precision. Nearby numbered pins use screen-space separation with leader
lines, without changing source coordinates. Landmark cards have clearer selected
and keyboard-focus states.
