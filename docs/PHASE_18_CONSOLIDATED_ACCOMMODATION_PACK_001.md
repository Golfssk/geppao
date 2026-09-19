# Phase 18 — Consolidated Accommodation Data Pack 001

**Status:** Awaiting duplicate preflight resolution
**Checked:** 2026-09-19 (Asia/Bangkok)
**Scope:** 20 direct-operator-source accommodation Places for the Pak Chong–Khao Yai pilot.

## Why this pack exists

This replaces the unexecuted, smaller Batch 008 import workflow. The pack lets the workspace administrator run one guarded transaction and one verification query rather than importing each research batch separately.

## Safety contract

- All 20 Places are created as **unclaimed** (`business_id = NULL`), **private** `pending` / `pending` records.
- The pack does **not** publish, update, or delete any Local Data.
- A preflight duplicate check stops the full transaction before any write if one of the 20 slugs already exists.
- No room rate, room count, check-in/out time, amenity, cover image, description, or recommended duration is invented.
- No `place_hours` rows are created: overnight accommodations must not be simplified into false “open 24 hours” planner facts.
- Only Mövenpick gets numeric coordinates because its official operator source explicitly publishes them.

## Included Places

| Place | Source-backed import fields | Source |
| --- | --- | --- |
| U Khao Yai | address, phone | https://www.uhotelsresorts.com/ukhaoyai/contact |
| Splendid Hotel Khao Yai | address, phone | https://www.splendidkhaoyai.com/ |
| Hotel Labaris Khao Yai | address, phone | https://www.hotellabaris.com/en |
| Hotel MYS Khao Yai | address | https://www.hotelmys.com/ |
| Kirimaya The Resort | address, phone | https://www.kirimaya.com/contact |
| Mövenpick Resort Khao Yai | address, phone, numeric coordinates | https://movenpick.accor.com/en/asia/thailand/khao-yai/resort-khao-yai.html |
| InterContinental Khao Yai Resort | address, phone | https://khaoyai.intercontinental.com/contact/ |
| Thames Valley Khao Yai | address, phone | https://www.thamesvalleykhaoyai.com/ |
| Lala Mukha Tented Resort Khao Yai | address, phone | https://lalamukha.com/ |
| The Series Resort Khaoyai | address, phone | https://www.theseriesresort.com/ |
| Rancho Charnvee Resort & Country Club | address, phone | https://www.charnveeresortkhaoyai.com/contact/ |
| Roukh Kiri Khaoyai, The Centara Collection | address, phone | https://www.centarahotelsresorts.com/the-centara-collection/rkk |
| dusitD2 Khao Yai | address, phone | https://www.dusit.com/dusitd2-khaoyai/contact-us/ |
| Fortune Courtyard Hotel Khao Yai | address, phone | https://www.fortunehotelgroup.com/fortune-courtyard-khaoyai/en |
| Marasca Khao Yai | address, phone | https://marasca.live/activity/khao-yai-national-park |
| Kensington English Garden Resort Khaoyai | address, phone | https://kensingtonresort-khaoyai.com/conference-halls |
| Muthi Maya Forest Pool Villa Resort | address, phone | https://www.kirimaya.com/resorts/muthimaya/ |
| Atta Lakeside Resort Suite | address, phone | https://www.kirimaya.com/resorts/atta |
| Parco Hotel Khaoyai | address, phone | https://parcohotelkhaoyai.thebonanzakhaoyai.com/home-en/ |
| Le Monte Hotel Khao Yai | address, phone | https://lemontekhaoyai.com/accommodation.php |

## Explicit exclusion

The Paz Khao Yai is excluded even though its historical contact page is available: its own website announces a temporary closure from 1 March 2025. It must not be added as an active accommodation candidate without a current reopening confirmation. https://www.thepazkhaoyai.com/

## Run order

1. If the import reports a duplicate error, first run `supabase/seed/phase_18_consolidated_accommodation_pack_001_preflight.sql` (read-only) and share its output.
2. After duplicate reconciliation, run `supabase/seed/phase_18_consolidated_accommodation_pack_001.sql`.
3. If it returns `Success`, run `supabase/seed/phase_18_consolidated_accommodation_pack_001_verify.sql`.

Expected successful result: 20 `PASS` rows and summary `place_count = 20`, `status = PASS`.
