# Business link-first intake

Entry: `/business/places/new` (also linked from the Business navigation and Places dashboard).

## User workflow

1. Paste one business listing URL, or choose manual entry.
2. Preview explicitly distinguishes `metadata`, `existing`, and `link_only`. Nothing is saved by preview.
3. Existing matches offer own-business management, or an ownership request sent to the existing Admin contact inbox. A submitted URL never grants ownership. Ambiguous same-name matches require review before creating a separate branch.
4. Confirm editable basics and optionally select up to three image URLs. New records are **draft / unverified**, never automatically published.
5. Success gives a direct manage link. Image failure does not delete a saved Place; image retries do not resubmit the Place.

## Source behavior (free-only)

- Google Maps: match public/local Gebpao records using place ID, existing source URL, or exact name. Short Maps links only resolve HTTP redirects to approved Maps domains; no Maps HTML, photos, ratings or reviews are scraped. Name in a full `/place/` path is a URL hint, not verified Google data. Do not use viewport coordinates as a venue's location.
- Agoda, Traveloka, Booking.com and Facebook: save a reference link, then allow manual completion. **No automatic platform content/photo import** and no false import-success message.
- Business-controlled websites: explicit user permission is required before reading a public HTML page. Read a single LocalBusiness-style JSON-LD entity, or Open Graph/title/description fallback. Multiple business entities are treated as ambiguous. Do not copy ratings, reviews, opening hours or booking prices.
- Image URLs: owner explicitly confirms their authority and names the rights holder. Only HTTPS JPG/PNG/WebP up to 5 MB; blocked platform/photo CDN hosts are not imported. Transfer to existing managed `place-images` storage, retain source evidence, pending Admin approval. **A selected image is not automatically a public/approved image.** Original source rights still matter; upload or website access is not proof of ownership.

## Security and data integrity

- Existing user-session Supabase clients/RLS only; no service-role key, new provider API, paid resource, or schema migration.
- Same-origin, bounded JSON, business membership; image endpoint additionally checks Place ownership before network access. Claims only write a contact request and cannot mutate Places/membership.
- Outbound network helper rejects credentials, non-HTTPS/nonstandard ports and internal/reserved DNS results, validates redirects, pins the approved IP to the TLS request, restricts content types and streamed byte count, bounds redirects and timeouts, and sends no user cookies/authentication.
- Known platform/CDN URLs are never fetched for page/image copying. This host denylist is not an assertion that every other website grants reuse rights; the owner must have permission.
- Save rechecks matches. Source-based slugs are deterministic per business/canonical URL and protected by the existing unique slug constraint. This prevents concurrent/retried creation from the same canonical link; it is not universal entity resolution across unrelated URLs/names.
- Exact-name and Maps-ID checks operate within existing RLS visibility. Unpublished records belonging to other businesses are not revealed.
- Unknown coordinates, facilities and destination remain unknown; do not default to the first active destination or guess amenities. Destination is explicitly selected or left null.
- No bulk workbook changes, existing Place overwrites, automatic claim acceptance, Google Billing, or paid enrichment.
- Runtime still consumes the project's existing free-tier bandwidth/storage quotas; this feature does not promise unlimited free storage. Keep operational quota monitoring and approval processes in place.

## Validation

`npm run check` includes `tests/intake-business-links.test.mjs`: source detection, metadata ambiguity, network/DNS/redirect/streaming limits, auth/origin/body checks, duplicate rechecks, draft provenance, owner claim routing, image ownership/rights/managed storage, and honest UI states.

Interactive QA uses only synthetic data and intercepted local API responses; it does not impersonate a live business owner or publish test listings.
