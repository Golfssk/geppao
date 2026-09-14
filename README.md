# GepPao MVP v1.0

Brand: GepPao (เก็บเป๋า)
Tagline: เก็บเป๋า... แล้วไปแฮงเอ้ากัน

## Stack
Next.js + TypeScript + Supabase + server-side AI adapter.

## Run
1. `npm install`
2. copy `.env.example` to `.env.local`
3. set Supabase environment variables
4. `npm run dev`

## Supabase
Run `supabase/migrations/001_initial.sql` in Supabase SQL Editor.

## Important
The AI endpoint is intentionally a safe mock adapter. Put real AI calls on the server and keep provider API keys out of client-side code. Replace `app/api/ai/trip/route.ts` with the selected provider implementation once the database and auth are connected.
