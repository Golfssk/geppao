# Phase 18 — Pilot Data Source Research

This document records source candidates only. It does not create or publish Local Data.

## Primary source candidates

### Khao Yai National Park official information

- Plan your visit: https://khaoyainationalpark.com/en/plan-your-visit
- Park entry fees: https://www.khaoyainationalpark.com/en/plan-your-visit/getting-here/park-entry-fees
- Useful for: official opening hours, entrance fees, visitor information, accessibility, and park rules.

### Tourism Authority of Thailand

- Khao Yai restaurants and attractions article: https://www.tourismthailand.org/Articles/khao-yai-the-hub-of-restaurants-and-attractions
- Useful for: discovery leads and editorial context. Each business still requires direct source verification before publication.

## Source handling rules

- Search results are leads, not publishable records.
- A record must be checked against an official business, venue, government, or direct operator source where possible.
- Social media may support freshness checks but should not be the only source for critical prices or opening hours when an official source exists.
- Every source URL and checked date must be stored in `place_sources` or the Event moderation evidence workflow.
- Conflicting sources produce a moderation warning; the system must not silently choose a value.
- No AI-generated name, address, coordinate, price, hours, image, or Event schedule may be written to Supabase.

## Suggested curation order

1. Khao Yai National Park as an Attraction with official access and fee data.
2. A small set of directly verified restaurants and cafes with operator-controlled hours and coordinates.
3. Activities with clear duration, age, equipment, and reservation requirements.
4. Seasonal Events only when an organizer source provides a current schedule.

## Acceptance before publication

- Source URL captured
- Source checked date captured
- Coordinates confirmed
- Hours or Event schedule confirmed
- Price unit identified or explicitly marked missing/free
- Recommended duration supported by source or curator decision
- Admin review completed
- Publication and verification statuses set intentionally
