# GepPao UI Audit & User Flows

## Purpose

This audit establishes the route map, primary journeys, and UX priorities for GepPao before the next visual refinement passes. It is the working baseline for implementation; it does not replace the factual catalog-readiness or security work.

## Product roles

| Role | Core outcome |
| --- | --- |
| Traveler | Discover trusted local places, form a realistic trip, save and adjust it. |
| Guest | Browse public content and understand the value before signing in. |
| Business partner | Add and maintain their places and events. |
| Curator / admin | Review quality, approve content, and monitor the pilot. |

## Current sitemap

### Traveler-facing

- `/` — Home / discovery entry
- `/search` — Unified search across Places and Events
- `/explore` — Catalog browse view
- `/places/[slug]` — Place detail
- `/events` — Event listing
- `/planner` — Prompt-to-itinerary planner
- `/trips` — Saved trips
- `/trips/new` — Manual trip creation
- `/trips/[id]` — Trip workspace and itinerary editing
- `/share/trips/[token]` — Public shared-trip view
- `/stay/[slug]` — Legacy stay detail route

### Partner and operations

- `/host` — Partner landing
- `/host/login` — Partner authentication
- `/host/dashboard` — Legacy host dashboard
- `/host/listings/new` and `/host/listings/[id]` — Legacy listing management
- `/business/places` / `new` / `[id]` — Business Place management
- `/business/events` / `new` / `[id]` — Business Event management
- `/admin` — Curation queue
- `/admin/data-quality` — Catalog readiness review
- `/admin/events` — Event review
- `/admin/places/[id]/curate` — Place curation
- `/admin/analytics` — Pilot analytics

### System states

- `/loading`, `/error`, `/not-found`

## Primary user flows

### 1. Discover → assess → plan → save

`Home` → category carousel or `Search` → `Place detail` → `Planner` → proposed itinerary → `Save trip` → `Trip workspace`

**Success condition:** A traveler can see content quality status, understand the trade-offs, create a multi-day plan, and return to it later.

### 2. Prompt-first planning

`Home hero` → `Planner` → dates + intent → plan output → edit or save → `Trip workspace`

**Success condition:** The Planner sets expectations when price, hours, route, or duration data is incomplete instead of inventing detail.

### 3. Browse Events

`Home` or `Search` → `Events` → event interest → planner or trip workspace

**Success condition:** Each event makes date, venue, price state, imagery, and demo/verification state easy to scan.

### 4. Partner publishing

`Host landing` → `Host login` → `Business Places/Events` → editor → curation queue → published traveler card

**Success condition:** Partners understand draft/pending/published status and the next action needed to go live.

### 5. Curation and data quality

`Admin` → review queue or `Data quality` → Place/Event editor → publish / return / archive → updated traveler visibility

**Success condition:** Curators can identify the highest-impact data gaps without a broken or dense operational layout.

## Audit findings and priority

### P0 — resolve before broader visual polish

1. **One primary discovery route is needed.** `/search` is the structured cross-content finder; `/explore` is currently a second catalog view with older "Local Data Preview" positioning and a fixed 60-item grid. Keep Search as the primary query flow and redefine Explore as curated category browsing.
2. **Legacy stay/listing routes need a clear migration boundary.** `/stay/*` and `/host/listings/*` should either be visually aligned and labeled legacy, or redirect intentionally to Place/Business experiences. They must not look like a separate product.
3. **Planner must preserve data-confidence language.** The new prompt form has been corrected for hierarchy; itinerary output remains the next traveler-facing focus, especially empty, loading, incomplete-data, and save-error states.

### P1 — next design implementation pass

1. **Place detail:** improve media, information hierarchy, action grouping, unavailable-data states, and related next steps.
2. **Itinerary / trip workspace:** create a clear day-by-day editing rhythm, visible travel estimates, save state, and empty-item affordances.
3. **Explore and Search:** establish their distinct jobs, filters, result density, and empty/no-match state.

### P2 — platform consistency

1. Account and sign-in journey
2. Host / Business / Admin operational states
3. Responsive keyboard, focus, labels, contrast, and reduced-motion QA

## Design-system implementation status

Completed foundation:

- Google Sans global typography
- GepPao forest / sage / rust palette retained
- Gold tokens restricted to premium/ceremony treatment
- 50px pill buttons with press-scale feedback
- 12px card radius and whisper-soft elevation
- Progressive App Shell navigation height: 64 / 72 / 83 / 99px
- Home category carousel and Journey feature band
- Planner headline and prompt-form hierarchy refinement

Do not introduce a separate Starbucks color system. The reference is used for component discipline, surface rhythm, responsive behavior, and interaction quality; GepPao remains visually distinct.

## Implementation sequence from this audit

1. Rework Place Detail + Trip Workspace / itinerary as one traveler journey.
2. Redefine Explore versus Search and align Place Card behavior.
3. Revisit Login, Account, Saved Trips, Business, and Admin with the shared component inventory.
4. Run full responsive and accessibility QA across every route.
5. Merge each cohesive route bundle only after Preview and validation pass.
