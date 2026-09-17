# Phase 11 — Complete Place Profiles and Images

## Goal
Complete the fields needed for multi-type Place management and create a dedicated image bucket independent of legacy Listings.

## Additions
- Place contact channels and website
- Indoor/outdoor classification
- Advance-booking lead time
- Accommodation room count
- Dining dietary/alcohol fields
- Activity instructor requirement
- Public `place-images` bucket limited to JPG, PNG and WebP, 8 MB per file
- Business-scoped upload/update/delete policies using `<business_id>/<place_id>/<filename>`

## Security
The bucket is public for delivery, but only authenticated editors of the owning Business may mutate objects. Database metadata continues to use `place_images` and its RLS policies.

## Gate
Run migration 007 and verify the bucket and policies before adding upload/profile UI.