begin;
-- User-supplied workbook archive, NOT publication approval or a Google content license.
-- No public catalog tables, statuses, media approvals or existing RPCs are changed.
create table public.workbook_import_batches (
 id uuid primary key default gen_random_uuid(),
 filename text not null check(length(filename) between 1 and 240),
 file_sha256 text not null unique check(file_sha256 ~ '^[0-9a-f]{64}$'),
 file_size_bytes integer not null check(file_size_bytes between 1 and 10485760),
 original_file bytea not null,
 sheet_manifest jsonb not null check(jsonb_typeof(sheet_manifest)='array'),
 expected_rows integer not null check(expected_rows between 1 and 100000),
 status text not null default 'uploading' check(status in('uploading','ready')),
 rights_status text not null default 'unconfirmed' check(rights_status in('unconfirmed','confirmed')),
 source_note text not null check(length(source_note) between 1 and 2000),
 audit_summary jsonb not null default '{}'::jsonb check(jsonb_typeof(audit_summary)='object'),
 data_as_of date,
 created_at timestamptz not null default now(), completed_at timestamptz,
 check(octet_length(original_file)=file_size_bytes),
 check(encode(sha256(original_file),'hex')=file_sha256),
 check((status='ready' and completed_at is not null) or (status='uploading' and completed_at is null))
);
create table public.workbook_import_rows (
 id uuid primary key default gen_random_uuid(),
 batch_id uuid not null references public.workbook_import_batches(id) on delete restrict,
 sheet_name text not null check(length(sheet_name) between 1 and 100),
 sheet_row integer not null check(sheet_row>=2),
 row_sha256 text not null check(row_sha256 ~ '^[0-9a-f]{64}$'),
 raw_values jsonb not null check(jsonb_typeof(raw_values)='array' and jsonb_array_length(raw_values)=11),
 name text not null check(length(btrim(name)) between 1 and 1000),
 suggested_place_type text not null check(suggested_place_type in('restaurant','cafe','accommodation','attraction','activity')),
 source_place_id text,
 source_maps_url text,
 source_rating numeric check(source_rating between 0 and 5),
 source_review_count integer check(source_review_count>=0),
 source_latitude double precision check(source_latitude between -90 and 90),
 source_longitude double precision check(source_longitude between -180 and 180),
 review_status text not null default 'pending' check(review_status in('pending','reviewed','rejected')),
 matched_place_id uuid references public.places(id) on delete restrict,
 created_at timestamptz not null default now(),
 unique(batch_id,sheet_name,sheet_row)
);
create index workbook_rows_batch_order_idx on public.workbook_import_rows(batch_id,sheet_name,sheet_row);
create index workbook_rows_source_identity_idx on public.workbook_import_rows(source_place_id);
create index workbook_rows_matched_place_idx on public.workbook_import_rows(matched_place_id);
alter table public.workbook_import_batches enable row level security;
alter table public.workbook_import_rows enable row level security;
revoke all on public.workbook_import_batches,public.workbook_import_rows from public,anon,authenticated;
-- Even Admin browser clients cannot write or fetch the original binary through REST.
grant select(id,filename,file_sha256,file_size_bytes,sheet_manifest,expected_rows,status,rights_status,source_note,audit_summary,data_as_of,created_at,completed_at) on public.workbook_import_batches to authenticated;
grant select on public.workbook_import_rows to authenticated;
create policy "Admins read workbook metadata" on public.workbook_import_batches for select to authenticated using(public.is_geppao_admin());
create policy "Admins read workbook source rows" on public.workbook_import_rows for select to authenticated using(public.is_geppao_admin());
comment on table public.workbook_import_batches is 'Private user-uploaded source archive. A ready upload is not approved for publication; data_as_of remains unknown unless evidenced.';
comment on column public.workbook_import_rows.source_rating is 'Historical value supplied in the workbook; not a live Google response or a Gebpao review.';
comment on column public.workbook_import_rows.suggested_place_type is 'Derived from sheet membership only; not an audited business classification.';
commit;
