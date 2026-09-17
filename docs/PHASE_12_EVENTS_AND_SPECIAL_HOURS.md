# Phase 12 — Events and Special Hours

## Foundation
- Atomic replacement of Place special hours
- Event images and dedicated storage bucket
- Event moderation history
- Admin Event moderation function
- Admin policies for Events, schedules, and images

## Event workflow
`draft → pending → published/rejected → archived`

Business editors own Event content and schedules. GepPao Admin controls publication. Published Event data is queryable by travel dates and remains separate from Places.

## Required order
1. Run migration 008.
2. Verify functions, tables, storage bucket, and policies.
3. Add Special Hours editor.
4. Add Business Event CRUD and schedules.
5. Add Admin Event review queue.
6. Add Public Events API and date-filtered Explore.