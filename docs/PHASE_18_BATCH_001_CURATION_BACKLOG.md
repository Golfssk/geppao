# Phase 18 — Batch 001 Local Data Curation Backlog

**Purpose:** a source-audited list of the first 20 non-accommodation candidates for the Pak Chong–Khao Yai pilot. This is a research and curation artifact only: it does **not** create, update, or publish Local Data.

**Checked:** 2026-09-19 (Asia/Bangkok)

## Guardrails

- A candidate is never published directly from research.
- `business_id` remains `NULL` for an unclaimed curated Place.
- Any future import must start in `publication_status = 'pending'` and `verification_status = 'pending'`.
- Prices, cover images, recommended durations, accessibility, and policies are omitted unless an exact source supports them.
- A source must be retained in `place_sources` with its checked time. Admin moderation decides whether a pending record can be published.
- No Event is derived from a recurring Place offering. Winery tours remain an `activity` candidate until the Event model is warranted by an organizer-provided, date-bound schedule.

## Status meanings

| Status | Meaning |
| --- | --- |
| `CURATION_INTAKE_READY` | Name, type, address, coordinates, and operating/schedule evidence have direct sources. It may be drafted as a pending, unclaimed Place after duplicate checking. It is **not** publication-ready. |
| `SOURCE_PARTIAL` | A reliable source exists, but one or more required facts are missing (usually numeric coordinates or a current schedule). Do not create a Place row yet. |
| `DISCOVERY_ONLY` | A lead is useful for later research, but lacks direct operator/government evidence needed for intake. |

## 20-candidate register

| # | Candidate | Proposed type | Status | Directly supported facts | Known gaps before a pending import | Sources |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Steak In Khao Yai | restaurant | `SOURCE_PARTIAL` | Government dataset identifies the venue and GPS `14.570450, 101.402233`. | Current direct opening-hours evidence; address confirmation. | [Foodsan / Department of Health](https://foodsan.anamai.moph.go.th/th/food-sanitation/download/?did=204386&id=72019&reload=) |
| 2 | Kua Kampan Khao Yai | restaurant | `SOURCE_PARTIAL` | Government dataset identifies the venue and GPS `14.517025, 101.431519`. | Current address, hours, and operator source. | [Foodsan / Department of Health](https://foodsan.anamai.moph.go.th/th/food-sanitation/download/?did=204386&id=72019&reload=) |
| 3 | Klua Jan Pha | restaurant | `SOURCE_PARTIAL` | Government dataset identifies the venue and GPS `14.535050, 101.387721`. | Current address, hours, and operator source. | [Foodsan / Department of Health](https://foodsan.anamai.moph.go.th/th/food-sanitation/download/?did=204386&id=72019&reload=) |
| 4 | KHRUA BINLA | restaurant | `SOURCE_PARTIAL` | Government dataset identifies the venue and GPS `14.534521, 101.386831`. | Current address, hours, and operator source. | [Foodsan / Department of Health](https://foodsan.anamai.moph.go.th/th/food-sanitation/download/?did=204386&id=72019&reload=) |
| 5 | Coffee Terrace | cafe | `SOURCE_PARTIAL` | Government dataset identifies the venue and GPS `14.697165, 101.407046`. | Current address, hours, and operator source. | [Foodsan / Department of Health](https://foodsan.anamai.moph.go.th/th/food-sanitation/download/?did=204386&id=72019&reload=) |
| 6 | Lookkai Cafe Restaurant Khao Yai | restaurant | `SOURCE_PARTIAL` | Government dataset identifies the venue and GPS `14.649007, 101.408054`. | Current address, hours, and operator source. | [Foodsan / Department of Health](https://foodsan.anamai.moph.go.th/th/food-sanitation/download/?did=204386&id=72019&reload=) |
| 7 | Ribs Mannn | restaurant | `CURATION_INTAKE_READY` | Official operator page supplies name, Thanarat km.4 Nong Nam Daeng address, daily `10:30–22:30` hours; government dataset supplies GPS `14.634528, 101.411187`. | Duplicate-slug and existing-Place preflight; source capture, description, image, price decision, duration, and Admin review. | [Ribs Mannn](https://www.ribs-mannn.com/), [Foodsan / Department of Health](https://foodsan.anamai.moph.go.th/th/food-sanitation/download/?did=204386&id=72019&reload=) |
| 8 | Pirom Café | cafe | `CURATION_INTAKE_READY` | Official operator page gives daily `08:00–17:00`, Phaya Yen / Pak Chong location, and map coordinates `14.564309, 101.250632`. | Duplicate preflight; image/price/duration decision; Admin review. | [Pirom Café](https://www.piromcafe.com/) |
| 9 | Great Hornbill Winery Restaurant | restaurant | `CURATION_INTAKE_READY` | Official operator page gives daily `11:00–20:00`, PB Valley address, and map coordinates `14.5749702, 101.2346983`. | Duplicate preflight; source capture, image/duration decision; Admin review. Menu prices are not imported without review of the dated menu. | [PB Valley — Restaurant](https://www.pbvalley.com/restaurant/) |
| 10 | PB Valley Vineyard & Winery Tour | activity | `CURATION_INTAKE_READY` | Official operator page provides address, GPS `14.5749702, 101.2346983`, weekday/weekend schedules, and current adult/child prices. | Model as an `activity`, not a dated Event; confirm activity details, reservation policy, duration, image decision, duplicate preflight, and Admin review. | [PB Valley — Wine Tour](https://www.pbvalley.com/wine-tour/) |
| 11 | Scenical World Khao Yai | attraction | `CURATION_INTAKE_READY` | Official site gives address, daily `10:00–18:00` hours with Wednesday closure, and map coordinates `14.5374498, 101.3781167`. | Confirm current ticket catalogue rather than importing price; set attraction details, duration, image decision, duplicate preflight, and Admin review. | [Scenical World](https://scenicalworld.com/) |
| 12 | GranMonte Vineyard & Winery | attraction | `SOURCE_PARTIAL` | Official page provides the winery address and official tour schedules/prices. | Numeric coordinates from a direct source, current opening hours for the destination, image/duration decision. | [GranMonte Tour](https://www.granmonte.com/tour.php), [GranMonte Contact](https://www.granmonte.com/contacts.php) |
| 13 | Papillon at U Khao Yai | restaurant | `SOURCE_PARTIAL` | Official hotel page provides daily `06:30–22:00` hours and full Mu Si address. | Numeric coordinates from a direct source, image/price/duration decision, duplicate preflight. | [Papillon / U Khao Yai](https://www.uhotelsresorts.com/ukhaoyai/dining/papillon) |
| 14 | Khao Yai Art Tree Café | cafe | `SOURCE_PARTIAL` | Official operator page provides daily `07:00–19:00` hours and the 168/1 Moo 8, Pong Talong address. | Numeric coordinates from a direct source; decide whether to model café and restaurant as separate Places under one Business. | [Khao Yai Art Tree](https://khaoyaiarttree.com/en/food-and-drink/) |
| 15 | Khao Yai Art Tree Restaurant | restaurant | `SOURCE_PARTIAL` | Official operator page provides breakfast `07:30–10:30`, lunch/dinner `11:30–20:00`, and the 168/1 Moo 8, Pong Talong address. | Numeric coordinates from a direct source; business/place boundary decision paired with café. | [Khao Yai Art Tree](https://khaoyaiarttree.com/en/food-and-drink/) |
| 16 | Khao Yai National Park | attraction | `SOURCE_PARTIAL` | Official park page provides daily `06:00–18:00`, Pak Chong/Mu Si visitor information, and a direct map reference. | Numeric coordinates of the specific visitor entry/Place to avoid representing the entire park imprecisely; precise price and recommended-duration design. | [Khao Yai National Park — Plan your visit](https://www.khaoyainationalpark.com/en/plan-your-visit), [Contact](https://www.khaoyainationalpark.com/en/contact-us) |
| 17 | BU•CO•LIC x Khaoyai Café | cafe | `SOURCE_PARTIAL` | TAT gives address, Wednesday closure, `09:00–17:00` hours, Google Map reference, outdoor pet allowance, and accessibility notes. The article is dated 2020; use it only as a source lead until refreshed by operator evidence. | Fresh direct operator confirmation; numeric coordinates. | [Tourism Authority of Thailand](https://www.tourismthailand.org/Articles/khao-yai-the-hub-of-restaurants-and-attractions) |
| 18 | Rabbit Café at Hotel Labaris | cafe | `SOURCE_PARTIAL` | TAT gives Hotel Labaris address and weekday/weekend opening hours. The article is dated 2020; it is not sufficient for current import alone. | Fresh direct operator confirmation and numeric coordinates. | [Tourism Authority of Thailand](https://www.tourismthailand.org/Articles/khao-yai-the-hub-of-restaurants-and-attractions) |
| 19 | Klang Pana Roses Garden & Café | cafe | `SOURCE_PARTIAL` | TAT gives address, `08:30–17:00` schedule and map reference. The article is dated 2020. | Fresh direct operator confirmation and numeric coordinates. | [Tourism Authority of Thailand](https://www.tourismthailand.org/Articles/khao-yai-the-hub-of-restaurants-and-attractions) |
| 20 | Campfire Café Khao Yai | cafe | `SOURCE_PARTIAL` | TAT gives 444 Thanarat Road address, Tuesday closure, `11:00–22:00` hours, and map reference. The article is dated 2020. | Fresh direct operator confirmation and numeric coordinates. | [Tourism Authority of Thailand](https://www.tourismthailand.org/Articles/khao-yai-the-hub-of-restaurants-and-attractions) |

## Batch result

- Candidates researched: **20**
- `CURATION_INTAKE_READY`: **5**
  - Ribs Mannn
  - Pirom Café
  - Great Hornbill Winery Restaurant
  - PB Valley Vineyard & Winery Tour
  - Scenical World Khao Yai
- `SOURCE_PARTIAL`: **15**
- Publish-ready: **0** — no candidate has completed the Phase 18 published-data gate or Admin moderation.
- Events created: **0** — no date-bound organizer schedule was found that should be represented as an Event.

## Import gate for the five intake-ready candidates

Before drafting any SQL, run a read-only preflight against production to confirm all five slugs and names are absent and that the Pak Chong–Khao Yai destination exists. The import may then:

1. Create only pending, unclaimed `places` records.
2. Insert directly evidenced `place_hours` and `place_sources` only.
3. Avoid prices unless each value has a current direct source and its correct `price_unit`.
4. Avoid images unless their usage/ownership is approved.
5. Preserve all missing fields as missing rather than estimate them.
6. Be run manually in Supabase only after the SQL is reviewed; it must not publish records.

## Next work

This closes the first 20-place research pass. The next output is a **single, source-linked SQL draft for only the five `CURATION_INTAKE_READY` candidates**, followed by the exact copy/paste preflight and verification SQL. It will not contain `UPDATE`, `DELETE`, `ALTER`, `CREATE`, or any publication transition.
