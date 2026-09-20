# Phase 18 — Publication Quality Gate

## Problem fixed

Before this gate, an Admin could approve a Place through `moderate_place()` without the complete evidence package needed for reliable whole-trip planning. This is unsafe for the 20 pending research-intake records.

## Data contract

Migration `013_phase_18_publication_quality_gate.sql` adds:

- `places.price_data_status`: `unknown`, `available`, `free`, `missing`, or `not_applicable`
- `places.price_data_note`: optional explanation for a non-price decision

It also replaces `moderate_place()` with a database-enforced publication gate.

## Approval requirements

An Admin approval now fails atomically unless the Place has:

1. Description
2. Address
3. Latitude and longitude
4. Recommended duration
5. Cover image
6. At least one opening-hours record
7. At least one source record
8. Explicit price decision
   - `available` plus at least one `price_items` row, or
   - `free`, `missing`, or `not_applicable`

The RPC remains the only path that writes moderation status and audit records. This preserves the existing Admin moderation log and database enforcement.

## Migration gate

- Migration is additive: no existing Place is published, edited, or deleted.
- Existing Places receive `price_data_status = 'unknown'`, so accidental approval is blocked until a curator decides.
- Do **not** merge PR #19 until the workspace administrator runs the migration and its verification query successfully.

## Out of scope

This migration does not add prices, images, descriptions, coordinates, or publish any Place. It protects the workflow while the curation queue is completed.
