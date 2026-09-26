# Production change log — 2026-09-26

## Supabase data

Applied `supabase/pilot_verified_contact_patch_2026_09_26.sql` to Production.

- 12 exact Place IDs updated with source-backed contact URLs/details.
- Hotel MYS: child/accessibility/parking flags confirmed.
- Khao Yai National Park: `pet_friendly=false` confirmed from the official park source.
- PB Valley tour: reservation required and 72-hour advance booking recorded.
- Publication and verification statuses were not changed.
- A read-only verification query returned all 12 expected rows.

## Google OAuth

Root cause: Supabase Auth used `http://localhost:3000` as Site URL and had no Production redirect URL.

Changes:

- Site URL → `https://geppao.vercel.app`
- Redirect URL added → `https://geppao.vercel.app/auth/callback`

Verification:

- Real Google OAuth completed successfully.
- Callback returned to `https://geppao.vercel.app/trips`.
- Authenticated page and logout control rendered.

## Planner production smoke

- Day trip: HTTP 200, `nights=0`, one day.
- Overnight: HTTP 200, `nights=1`, two days.
- Pet constraint: HTTP 422 with explicit `constraintGap` (no unknown-as-true recommendation).
- Family constraint: HTTP 422 with explicit `constraintGap`.
