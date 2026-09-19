# Phase 18 — Consolidated Dining Data Pack 002

**Status:** Research complete; ready for CI review
**Checked:** 2026-09-19 (Asia/Bangkok)
**Scope:** 20 source-backed restaurant/cafe Places in the Pak Chong–Khao Yai pilot.

## Import behavior

This pack is intentionally **idempotent**:

- A candidate whose slug already exists is skipped without changing its Place, source, hours, price, or publication state.
- New Places, their one source record, and any direct-supported hour rows are created together.
- Every new record is unclaimed (`business_id = NULL`) and `pending` / `pending`.
- The pack never publishes, updates, or deletes Local Data.

## Data fidelity

- Only direct operator sources are used (official property websites, official Facebook, or official Instagram).
- Missing address, coordinates, price, cover image, description, recommended duration, and split service windows remain missing rather than being inferred.
- A source that states an hour range without a complete weekly schedule is retained as a source but does not generate `place_hours` rows.
- Parent hotel addresses are used only for venues that the operator explicitly places within that hotel.

## Included Places

| Place | Type | Direct source |
| --- | --- | --- |
| Midwinter Khao Yai | restaurant | https://www.midwinterkhaoyai.com/en/contact-us |
| The Castle Restaurant and Tea Room | restaurant | https://www.thamesvalleykhaoyai.com/restaurant/the-castle-restaurant-and-tea-room/ |
| Prime 19 Khao Yai | restaurant | https://www.facebook.com/prime19khaoyai/ |
| The Witches Brew Restaurant Khao Yai | restaurant | https://www.facebook.com/p/The-Witches-Brew-Restaurant-Khao-Yai-100063777901100/ |
| Banmai Chay Nam Pak Chong | restaurant | https://www.facebook.com/banmaichaynampakchong/ |
| Yellowsubmarine Coffee | cafe | https://www.instagram.com/yellowsubmarine_coffee/ |
| The Birder's Lodge Cafe | cafe | https://www.thebirderslodge.com/ |
| Please Don't Tell Khaoyai | cafe | https://www.facebook.com/PleaseDontTellKhoayai/ |
| Like A Mountain Khao Yai | cafe | https://www.facebook.com/100075921802080/ |
| Baankhaofae Farm Eatery & Coffee | cafe | https://www.facebook.com/baankhaofae/ |
| The Creek Khao Yai | cafe | https://www.facebook.com/TheCreekKhaoYai/ |
| Olna Khaoyai | cafe | https://www.facebook.com/OlnaxPYRoasters/ |
| Flavours of Khao Yai | restaurant | https://www.movenpickresortkhaoyai.com/dining/flavours-of-khao-yai/ |
| Sapori Cucina | restaurant | https://www.movenpickresortkhaoyai.com/dining/sapori-cucina/ |
| Castleton Café | cafe | https://www.movenpickresortkhaoyai.com/dining/castleton-cafe/ |
| Acala Restaurant | restaurant | https://www.kirimaya.com/dining/kirimaya-acala-restaurant/ |
| TANI Restaurant | restaurant | https://www.kirimaya.com/dining/atta-tani-restaurant/ |
| Cha La Restaurant & Bar | restaurant | https://www.hotelmys.com/ |
| The Fable Feast | restaurant | https://www.hotellabaris.com/facility/the-fable-feast/ |
| Clotted Cream Tea Room | cafe | https://www.thamesvalleykhaoyai.com/restaurant/clotted-cream-tea-room |

## Run order

1. Run `supabase/seed/phase_18_consolidated_dining_pack_002.sql`.
2. Run `supabase/seed/phase_18_consolidated_dining_pack_002_verify.sql`.
3. Share the verification output.

Expected: every listed slug reports `PASS`; records pre-existing before the run may show `existing` rather than `inserted` in the import result.
