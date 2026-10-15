# Public Agoda UX reference → independent GepPao stay journey

## Evidence and scope

Observed public rendered pages in TH and EN during this implementation:

- https://www.agoda.com/th-th/ — Thai discovery entry: destination/property input, paired check-in/out, guest/room selector, primary search action and separate language/currency controls.
- https://www.agoda.com/city/khao-yai-th.html — English destination entry: destination heading, travel-date context, guest context and property discovery links.
- https://www.agoda.com/rancho-charnvee-khaoyai/hotel/khao-yai-th.html — English detail: photo entry, property heading, highlights, facilities, room-selection section, about section and FAQs.

These observations are **not** Agoda's backend schema, ranking algorithm, private API contract, full search-results behavior or a comprehensive parity audit. A rendered search-results page and Agoda's mobile layout were not exhaustively tested. Regional content and page experiments may vary.

Browser inspection was performed through the shared public browser. REA 6.4.0 was separately installed and successfully used to statically analyze a source-only GepPao snapshot. Its `list-browser-targets` check rejected the remote chat browser endpoint; therefore no Agoda REA browser capture is claimed.

## Adaptation decisions

| Public pattern | GepPao implementation | Intentional boundary |
| --- | --- | --- |
| Search context close to the primary action | Stay name/area, destination, paired dates, guest count | Dates are planning context, never asserted availability |
| Dedicated property discovery | `/stays`, linked from navigation and unified search | Does not replace restaurants, attractions, events or legacy routes |
| Scan-friendly information groups | Image region, location, known amenities, verification state, reference price and detail CTA | No fabricated rating, review count, discount, urgency or availability |
| Structured property detail | Section anchors, approved media gallery, overview, prices, facts and sticky contact/planning card | No room-selection/payment funnel without real inventory |
| Separate locale and monetary semantics | TH/EN UI; explicit original-language catalog copy | No machine-invented English names or currency conversion |

The GepPao forest/sage/rust identity and design system remain intact. Agoda trademarks, assets, text, catalog data and scripts are not included in application code.

## Backend conclusions

Only user-visible requirements are inferred: search must preserve query context, constrain requests, keep prices comparable, treat unknown facts honestly, and separate discovery from reservation. The architecture in `STAY_DISCOVERY_ARCHITECTURE.md` is an independent design for GepPao's existing schema, not a claim to have recovered Agoda's systems.
