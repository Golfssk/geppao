# Phase 18 — Batch 008 Accommodation Intake

**Purpose:** increase verified-source accommodation coverage for the Pak Chong–Khao Yai pilot without fabricating stay, price, room, or amenity details.

**Checked:** 2026-09-19 (Asia/Bangkok)

## Records

| Place | Directly supported facts imported | Intentionally missing |
| --- | --- | --- |
| U Khao Yai | official property identity, address, phone | numeric coordinates, room inventory, check-in/out, structured price, images, description, recommended duration |
| Splendid Hotel Khao Yai | official property identity, address, phone | numeric coordinates, room inventory, check-in/out, structured price, images, description, recommended duration |
| Hotel Labaris Khao Yai | official property identity, address, phone | numeric coordinates, room inventory, check-in/out, structured price, images, description, recommended duration |
| Hotel MYS Khao Yai | official property identity and address | numeric coordinates, phone confirmation, room inventory, check-in/out, structured price, images, description, recommended duration |
| Kirimaya The Resort | official property identity, address, phone | numeric coordinates, room inventory, check-in/out, structured price, images, description, recommended duration |
| Mövenpick Resort Khao Yai | official property identity, address, phone and operator-published coordinates | room inventory, check-in/out, structured price, images, description, recommended duration |

## Sources

- U Khao Yai: https://www.uhotelsresorts.com/ukhaoyai
- Splendid Hotel Khao Yai: https://www.splendidkhaoyai.com/
- Hotel Labaris Khao Yai: https://www.hotellabaris.com/en
- Hotel MYS Khao Yai: https://www.hotelmys.com/
- Kirimaya: https://www.kirimaya.com/contact
- Mövenpick Resort Khao Yai: https://movenpick.accor.com/en/asia/thailand/khao-yai/resort-khao-yai.html

## Safety decisions

- All records are unclaimed, `pending` / `pending`, and excluded from public search and Planner V2.
- No nightly rate, package, room count, check-in/out, amenity, image, or generated description is inserted.
- No 24-hour `place_hours` are assumed merely because a hotel accepts overnight stays.
- Coordinates are imported only for Mövenpick because its official operator page publishes a numeric coordinate.

## Run order

1. Run `supabase/seed/phase_18_batch_008_accommodation_intake.sql`.
2. Confirm `Success`.
3. Run `supabase/seed/phase_18_batch_008_verify.sql` and share the output.
