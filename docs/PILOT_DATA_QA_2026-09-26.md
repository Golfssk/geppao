# GepPao Pilot Data QA Report

**Audit date:** 2026-09-26  
**Scope:** 15 existing Place records selected for Pak Chong / Khao Yai pilot  
**Companion workbook:** `geppao_pilot_verified.xlsx`

## Executive decision

- **Public launch: NO-GO**
- **Internal pilot: CONDITIONAL GO** for 6 data-pass records, provided unlicensed venue images are hidden or replaced with GepPao-owned generic placeholders.
- Do not bulk-import the workbook. Apply only a reviewed field-level change set.

## Results

| Metric | Result |
|---|---:|
| Selected Places | 15 |
| Data-pass for internal pilot | 6 |
| Needs owner/curator review | 9 |
| Rejected | 0 |
| Coordinates present | 15 |
| Current positive duration present | 7 |
| Explicit price decision | 15 |
| At least one provenance source | 15 |
| Cover images with permission evidence | 0 |

## Data-pass records

1. Hotel MYS Khao Yai
2. Mövenpick Resort Khao Yai
3. ATV เขาใหญ่ กม.9
4. Khao Yai National Park
5. Pirom Café
6. The Chocolate Factory Khao Yai

“Pass” means the current structured record is usable for an internal test of the main planner path. It does **not** mean media rights or final owner verification are complete.

## Records requiring confirmation

- **PB Valley Vineyard & Winery Tour** — official page confirms four daily departures and a 70-minute tour; the displayed prices expired on 2025-10-31, so they were deliberately excluded.[^https://www.pbvalley.com/wine-tour/]
- **GranMonte Vineyard & Winery** — official schedule/contact are available; duration and coordinate provenance still require review.[^https://www.granmonte.com/tour.php]
- **Khao Yai Art Museum** — official identity, address and daily hours are available; duration remains a GepPao editorial proposal.[^https://www.khaoyai-artmuseum.com/]
- **Scenical World Khao Yai** — official hours and Wednesday closure are supported; ticket prices and visit duration remain unresolved.[^https://scenicalworld.com/]
- **Great Hornbill Winery Restaurant** — official daily hours/contact are supported; duration is editorial.[^https://www.pbvalley.com/restaurant/]
- **Ribs Mannn** — official daily hours/contact are supported; duration is editorial.[^https://www.ribs-mannn.com/]
- **Khao Yai Kayak Nature Trips & ATV** — social source supports activity identity, daily service and pet access; exact hours, package duration, price validity and safety requirements need owner confirmation.
- **The Birder's Lodge Cafe** — official identity/address/contact are available; current café hours and price policy remain unresolved.[^https://www.thebirderslodge.com/]
- **Steak In Khao Yai** — government source corroborates identity/coordinates, but accessible official-hour snippets conflict.

## Verification rules applied

1. No coordinates, operating hours, prices, phone numbers, pet/child policies or media rights were invented.
2. `missing` is an explicit price-data decision and is never converted to zero.
3. Expired prices were rejected rather than reused.
4. Editorial duration proposals are separated from importable facts.
5. Unknown pet/child suitability stays blank. Only explicit authoritative evidence may produce `TRUE` or `FALSE`.
6. Planner recommendations must continue to reference existing Place/Event IDs.

## Media decision

The reviewed export contains 17 media records; most are Unsplash placeholders. No reviewed record contains sufficient permission evidence to approve a cover image. All `approved_for_import` values remain `FALSE`.

Recommended internal-pilot handling:

- suppress third-party venue images; or
- show a GepPao-owned generic category placeholder;
- never copy Google Maps, Booking, Agoda or Facebook media without explicit permission/license evidence.

## Legal decision

Current Privacy, Terms, Support and Owner Import Consent content is useful operationally but not ready for a full public/commercial launch. Required decisions remain:

- legal name and address of the data controller/operator;
- privacy contact/DPO route;
- purpose/legal-basis matrix;
- record-specific retention periods;
- international transfer disclosure for Vercel, Supabase, Google and other processors;
- complete data-subject rights and complaint process;
- governing law, liability and user-content/license terms;
- final Thai legal review.

The Thai PDPC publishes privacy-notice resources; the GPPC example includes retention and data-subject-rights sections, while the PDPC separately publishes cross-border-transfer criteria.[^https://www.pdpc.or.th/privacy] [^https://gppc.pdpc.or.th/privacy-policy/] [^https://www.pdpc.or.th/en/22822]

## Google OAuth

- Provider redirect to Google works.
- End-to-end callback and return-path validation requires one real user login and any 2-step verification demanded by Google.
- Do not mark this launch gate complete until the production session returns successfully to GepPao and an authenticated profile/session is visible.

## Import recommendation

Do not run a blind workbook import. Prepare a transaction containing only the verified contact/policy fields, review the SQL diff, then apply it with exact Place IDs. Keep verification/publication statuses unchanged until the curator signs off.

## Go/No-go

| Gate | Decision |
|---|---|
| Internal traveler pilot with six records and no third-party images | **CONDITIONAL GO** |
| Owner pilot using Draft-only flow | **CONDITIONAL GO** |
| Public launch | **NO-GO** |
| Monetization | **NO-GO** |

## Required next evidence

1. Written image permission or license evidence for each public cover.
2. Owner confirmation for the 9 review records.
3. Real Google login callback test.
4. Legal controller identity and Thai counsel approval.
5. Production QA after reviewed data changes are applied.
