# Phase 18 — Admin Curation Editors

## Objective

Allow an Admin to complete source-backed, unclaimed Places without assigning a fabricated Business owner or bypassing RLS.

## Migration 014

`014_admin_curation_editors.sql` is additive and depends on Migration 013.

It adds:

- Admin update RLS for `places`, `place_images`, `place_hours`, and `price_items`
- Security-definer, Admin-authorized hour and price replacement RPCs
- Restricted Storage upload/update/delete policies for curation images under `place-images/admin/{place_id}/...`

## Security decisions

- Business policies are preserved; Admin policies are additive and require `is_geppao_admin()`.
- Unclaimed Places remain `business_id = NULL`.
- Admin image objects can only use the `admin/{place_id}/...` path and only for an existing Place.
- The application must never accept publication or verification status from the client.
- Migration 013 still makes database-side publication approval conditional on the quality gate and writes the moderation audit log.

## Migration gate

Do not merge PR #19 or deploy the Admin curation UI until the workspace administrator has run Migration 014 and its verification SQL successfully.
