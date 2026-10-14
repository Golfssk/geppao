# GepPao

GepPao (เก็บเป๋า) is a Local Trip Intelligence Platform for turning traveler needs into a usable whole-trip plan. Pilot area: Pak Chong–Khao Yai.

## Stack
Next.js + TypeScript + Supabase + server-side planning adapter.

## Run
1. `npm install`
2. Copy `.env.example` to `.env.local`
3. Set Supabase environment variables
4. `npm run dev`

## Supabase
For a new environment, run repository migrations in order. See `docs/CURRENT_DATABASE_SCHEMA.md` and `docs/PHASE_08_DATABASE_MIGRATION.md` before changing production.

The live Supabase schema is the source of truth. Migrations are additive: preserve legacy `hosts`/`listings` until all runtime reads have migrated and passed regression tests.

## Product rules
- Use real stored Local Data only; never invent places, prices, hours, or events.
- Filter hard constraints before preference ranking.
- Business users submit content; Admin curation controls publication.
- Keep secrets and service-role credentials out of client-side code.

## Stay discovery (TH / EN)

- `/stays` is the lodging-specific search journey; `/search` remains the unified Place/Event finder.
- Apply `028_public_stay_search.sql` to a disposable staging environment **before** testing or deploying this route against that environment.
- `npm run test:stays` covers input validation, literal search safety, pagination, nightly-price semantics, relation shapes, and RLS-preserving SQL on a synthetic PGlite schema.
- See `docs/STAY_DISCOVERY_ARCHITECTURE.md` for release gates and limitations and `docs/AGODA_PUBLIC_UX_RESEARCH.md` for the external reference scope.
- Optional local reverse-engineering tools live in `tools/rea`; they are not application dependencies or a Supabase integration.
