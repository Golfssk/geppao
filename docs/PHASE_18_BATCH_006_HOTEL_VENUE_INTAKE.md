# Phase 18 — Batch 006 Hotel Venue Intake

**Purpose:** add source-backed, private curation records for independently visitable dining venues inside two Khao Yai hotels.

**Checked:** 2026-09-19 (Asia/Bangkok)

## Architecture decision

Each venue is a separate **Place** because travelers can visit it as a distinct destination. This intake does **not** create a `businesses` record: creating a shared Business requires an ownership/management verification step that is not part of this batch.

All records are unclaimed (`business_id = NULL`), `pending` publication, and `pending` verification. None are public or Planner-eligible.

## Records

| Place | Type | Hours imported | Address source | Notes |
| --- | --- | --- | --- | --- |
| Lacol Dome Dining | restaurant | daily 17:00–22:00 | Chatrium operator page | No numeric coordinates, price, image, description, or duration imported. |
| Journey Café & Bar | cafe | daily 09:00–22:00 | Chatrium operator page | No numeric coordinates, price, image, description, or duration imported. |
| Audrey | restaurant | daily 07:00–22:00 | Chatrium operator page | No numeric coordinates, price, image, description, or duration imported. |
| Raleuk Khaoyai | restaurant | Sun/Mon/Wed–Sat 11:00–22:00; Tue closed | Chatrium operator page | No numeric coordinates, price, image, description, or duration imported. |
| Poirot | restaurant | Sun–Tue/Thu–Sat 18:00–23:00; Wed closed | InterContinental operator page | Source states advance reservations are required for non-residents; this is captured as `reservation_required = true`. |
| Tea Carriage | cafe | Sun/Mon/Wed–Sat 11:00–18:00; Tue closed | InterContinental operator page | Source states advance reservations are required for non-residents; this is captured as `reservation_required = true`. |
| Somying’s Kitchen | restaurant | none — split breakfast/lunch/dinner windows intentionally omitted | InterContinental operator page | The current one-interval-per-day editor cannot faithfully represent its three service windows. Do not collapse them into one interval. |

## Sources

- Lacol Khao Yai / Chatrium dining: https://www.chatrium.com/lacolkhaoyai/experiences/dine
- InterContinental Khao Yai dining: https://khaoyai.intercontinental.com/dining
- InterContinental Khao Yai address: https://khaoyai.intercontinental.com/

## Non-negotiable safety decisions

- No numeric coordinate is inferred from an address, map pin, or hotel-level location.
- No price is imported without a direct, current source for an individual price item.
- No cover image is imported without verified reuse rights and an approved storage upload.
- Somying’s Kitchen gets no `place_hours` rows rather than inaccurate simplified hours.
- This batch does not publish data, change existing records, or create Events.

## Run order

1. Run `supabase/seed/phase_18_batch_006_hotel_venue_intake.sql` in Supabase SQL Editor.
2. Confirm it returns `Success`.
3. Run `supabase/seed/phase_18_batch_006_verify.sql`.
4. Share the verification output in the project chat.
