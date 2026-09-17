# Hotfix 010 — Trip creation RLS

The browser-facing API no longer inserts directly into `trips`. `create_trip_with_days` verifies `auth.uid()`, assigns ownership server-side, validates dates/travelers/budget, and creates Trip Days atomically. This fixes `new row violates row-level security policy for table trips` without weakening table RLS.

Run migration 010 before deploying the API changes.