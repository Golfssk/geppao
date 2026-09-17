# Phase 11 — Local Data Editors

This phase adds the database contract required for safe Business-managed opening hours, special hours, structured prices, and type-specific details.

## Required order
1. Run migration 006.
2. Verify new columns, policies, and RPC functions.
3. Add Business editor UI and API routes.
4. Test with owner and non-owner accounts.
5. Only then merge the application UI.

`replace_place_hours` and `replace_place_prices` perform authorization plus replacement atomically, preventing partial delete/insert failures. Public reads remain limited to Published Places.