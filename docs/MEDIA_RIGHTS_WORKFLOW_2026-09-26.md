# Media rights evidence workflow — 2026-09-26

## Status

Code and migration prepared. Deploy only after applying `022_media_rights_evidence.sql` to Supabase Production.

## Workflow

1. Owner/Admin supplies the rights holder and confirms authority before upload.
2. The upload API stores rights basis, evidence reference, permission date and takedown status.
3. Every new upload starts with `approved_for_public=false`.
4. Admin reviews the evidence and explicitly approves or revokes a Place image.
5. Public RLS returns only approved, active and unexpired media attached to a published record.
6. Admin Data Quality counts a cover only when it is both managed by GepPao and approved for public use.

## Safety

- Existing media is backfilled as unapproved.
- Existing publication and verification statuses are unchanged.
- Approval requires rights holder, basis, evidence, permission date, approver and approval timestamp.
- Takedown states are `active`, `requested`, or `removed`.
- Public pages continue to fail closed when no approved image exists.
