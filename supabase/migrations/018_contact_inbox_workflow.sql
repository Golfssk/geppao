alter table public.leads
  add column if not exists status text not null default 'new',
  add column if not exists admin_note text,
  add column if not exists handled_by uuid references auth.users(id) on delete set null,
  add column if not exists handled_at timestamptz;

alter table public.leads
  add constraint leads_status_check check (status in ('new','in_progress','closed')),
  add constraint leads_admin_note_length check (admin_note is null or char_length(admin_note) <= 2000);

create index if not exists leads_status_created_idx on public.leads(status, created_at desc);

create policy "Admins read leads"
on public.leads for select to authenticated
using (public.is_geppao_admin());

create policy "Admins update leads"
on public.leads for update to authenticated
using (public.is_geppao_admin())
with check (public.is_geppao_admin());

revoke select, update, delete on public.leads from anon;
grant insert on public.leads to anon;
grant select, insert, update on public.leads to authenticated;
