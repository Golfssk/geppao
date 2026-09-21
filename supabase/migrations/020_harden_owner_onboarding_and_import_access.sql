revoke execute on function public.create_my_business(text,text) from anon, public;
grant execute on function public.create_my_business(text,text) to authenticated;

drop policy if exists "Members read memberships" on public.business_members;
create policy "Members read memberships" on public.business_members
for select to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "Business editors manage import sources" on public.place_import_sources;
drop policy if exists "Admins read import sources" on public.place_import_sources;
create policy "Editors read import sources" on public.place_import_sources
for select to authenticated
using (public.is_geppao_admin() or exists(select 1 from public.places p where p.id=place_id and public.is_business_editor(p.business_id)));
create policy "Editors insert import sources" on public.place_import_sources
for insert to authenticated
with check (exists(select 1 from public.places p where p.id=place_id and public.is_business_editor(p.business_id)));
create policy "Editors update import sources" on public.place_import_sources
for update to authenticated
using (exists(select 1 from public.places p where p.id=place_id and public.is_business_editor(p.business_id)))
with check (exists(select 1 from public.places p where p.id=place_id and public.is_business_editor(p.business_id)));
create policy "Editors delete import sources" on public.place_import_sources
for delete to authenticated
using (exists(select 1 from public.places p where p.id=place_id and public.is_business_editor(p.business_id)));

create index if not exists leads_handled_by_idx on public.leads(handled_by) where handled_by is not null;
create index if not exists place_import_sources_confirmed_by_idx on public.place_import_sources(confirmed_by) where confirmed_by is not null;
create index if not exists places_business_id_idx on public.places(business_id) where business_id is not null;
