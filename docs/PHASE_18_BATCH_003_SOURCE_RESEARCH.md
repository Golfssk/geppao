# Phase 18 — Batch 003 Source Research Backlog

**Purpose:** continue the Pak Chong–Khao Yai curation pipeline with direct operator and institutional sources. This file is research only; it does not create, edit, or publish Local Data.

**Checked:** 2026-09-19 (Asia/Bangkok)

## Direct-source candidates

| Candidate | Proposed type | Directly supported information | Intake status | Source |
| --- | --- | --- | --- | --- |
| The Chocolate Factory Khao Yai | restaurant | 352 Moo 2, Mu Si, Pak Chong; restaurant open 10:30–21:30; official Google Map reference. | Source partial — numeric coordinates and price review still required. | https://thechocolatefactorythailand.com/EN/SHOP&RESTUARANT |
| Lamaya Khaoyai | restaurant | 369 Moo 4 Tanarat Road, Mu Si, Pak Chong; Sun–Fri 11:00–23:00; Sat/long weekend 11:00–01:00. | Source partial — numeric coordinates and structured price review required. | https://www.lamayakhaoyai.com/day-experience |
| Lacol Dome Dining | restaurant | Direct hotel operator source; daily 17:00–22:00; Lacol Khao Yai address. | Source partial — numeric coordinates, price/duration, and separation from the hotel Business required. | https://www.chatrium.com/lacolkhaoyai/experiences/dine |
| Journey Café & Bar | cafe | Direct hotel operator source; daily 09:00–22:00; Lacol Khao Yai address. | Source partial — numeric coordinates, price/duration, and Business/place boundary required. | https://www.chatrium.com/lacolkhaoyai/experiences/dine |
| Audrey | restaurant | Direct hotel operator source; daily 07:00–22:00, breakfast 07:00–10:30; Lacol Khao Yai address. | Source partial — numeric coordinates, price/duration, and Business/place boundary required. | https://www.chatrium.com/lacolkhaoyai/experiences/dine |
| Raleuk Khaoyai | restaurant | Institutional hotel source lists Mon–Sun 11:00–22:00, closed Tuesday; located within Lacol Khao Yai. | Source partial — direct restaurant confirmation, numeric coordinates, price/duration required. | https://www.chatrium.com/lacolkhaoyai/experiences/dine |
| The Park Khaoyai Cafe and Restaurant | restaurant | Official Facebook states 789 Moo 7, Mu Si, Pak Chong; 11:00–20:00; closed Tuesday. | Source partial — numeric coordinates and current source capture required. | https://www.facebook.com/TheParkkhaoyai/ |
| EL Café Khaoyai | cafe | Official Facebook gives daily 08:30–17:30. Hotel source gives Nong Nam Daeng / Pak Chong location. | Source partial — address and coordinates require direct reconciliation. | https://www.facebook.com/elcafekhaoyai/ |
| Trot Cafe Khaoyai | cafe | Official Facebook posts state daily 10:00–19:00. | Source partial — address and numeric coordinates required. | https://www.facebook.com/trotcafekhaoyai/ |
| Sai Sook Khao Yai Wildlife Learning Ground & Local Treats | attraction | Official Facebook identifies a wildlife-learning activity venue at 286 Moo 4, Pak Chong and advertises daily 09:30–17:00 in a dated post. | Source partial — fresh schedule and numeric coordinates required. | https://www.facebook.com/SaisookKhaoYai/ |
| Somying’s Kitchen | restaurant | Direct InterContinental source: breakfast 07:00–11:00, lunch 12:00–15:00, dinner 18:00–22:00; resort address is 262 Moo 6, Pong Talong, Pak Chong. | Source partial — model split service windows, coordinates, prices, and Business/place boundary. | https://khaoyai.intercontinental.com/dining |
| Poirot | restaurant | Direct InterContinental venue source confirms restaurant identity within resort. | Source partial — current hours, coordinates, prices, and Business/place boundary required. | https://khaoyai.intercontinental.com/dining/poirot/ |
| Tea Carriage | cafe | Direct InterContinental source: 11:00–18:00, closed Tuesday; resort address is 262 Moo 6, Pong Talong, Pak Chong. | Source partial — numeric coordinates and price review required. | https://khaoyai.intercontinental.com/dining/tea-carriage |
| Terminus Bar | activity | Direct InterContinental source: 10:00–22:00; pets allowed; adjacent to Somying’s Kitchen. | Source partial — activity/place classification review, numeric coordinates and price review required. | https://khaoyai.intercontinental.com/dining/terminus-bar |
| Rapsodia Park Khao Yai | activity | Discovery leads describe adventure activities and weekend operation, but current evidence is third-party. | Discovery only — find direct operator source before any intake. | https://www.trip.com/moments/poi-rapsodia-park-khao-yai-136976171 |

## Research decisions

- The 14 `Source partial` candidates are **not** added to Supabase yet. They require numeric coordinates or other specific field confirmation.
- Rapsodia remains a discovery lead only; no SQL will be drafted from third-party evidence.
- Resort venues must stay separate Places when the user can visit them independently, but can later share one verified Business.
- No historic Event listed on an operator page is converted into an Event record unless its organizer provides a current, date-bound schedule.

## Next evidence targets

1. Capture direct map coordinates for the direct-source candidates.
2. Reconcile sources for EL Café and Trot Cafe.
3. Extract a current, operator-supported price or deliberately record an explicit missing-price decision.
4. Research permitted cover-image provenance before upload.
