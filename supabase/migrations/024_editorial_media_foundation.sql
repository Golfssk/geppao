-- Phase 1 Media Foundation: editorial publishing and destination-linked stories.
-- Additive only. No editorial content is auto-published.
begin;

create table if not exists public.editorial_authors(
  id uuid primary key default gen_random_uuid(),
  display_name text not null check(char_length(trim(display_name)) between 2 and 100),
  slug text unique not null check(slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  bio text check(bio is null or char_length(bio)<=1000),
  avatar_url text,
  status text not null default 'active' check(status in('active','inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.articles(
  id uuid primary key default gen_random_uuid(),
  destination_id uuid references public.destinations(id) on delete set null,
  author_id uuid references public.editorial_authors(id) on delete set null,
  title text not null check(char_length(trim(title)) between 5 and 180),
  slug text unique not null check(slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  excerpt text check(excerpt is null or char_length(excerpt)<=500),
  body_markdown text not null default '',
  category text not null check(category in('destination_guide','itinerary','food_drink','stay','cafe','activity','event_news','travel_advice','local_story','deal')),
  tags text[] not null default '{}',
  cover_image_url text,
  cover_alt_text text,
  cover_rights_holder text,
  cover_rights_basis text check(cover_rights_basis is null or cover_rights_basis in('owner','licensed','public_domain','geppao_owned')),
  cover_permission_evidence text,
  cover_approved_for_public boolean not null default false,
  reading_minutes integer check(reading_minutes is null or reading_minutes between 1 and 180),
  is_featured boolean not null default false,
  commercial_type text not null default 'organic' check(commercial_type in('organic','affiliate','sponsored')),
  sponsor_name text,
  affiliate_disclosure text,
  seo_title text check(seo_title is null or char_length(seo_title)<=70),
  seo_description text check(seo_description is null or char_length(seo_description)<=180),
  canonical_url text,
  publication_status text not null default 'draft' check(publication_status in('draft','review','published','archived')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint articles_commercial_disclosure_check check(
    commercial_type='organic'
    or (commercial_type='affiliate' and nullif(trim(affiliate_disclosure),'') is not null)
    or (commercial_type='sponsored' and nullif(trim(sponsor_name),'') is not null)
  ),
  constraint articles_cover_rights_check check(
    cover_image_url is null
    or not cover_approved_for_public
    or (
      nullif(trim(cover_alt_text),'') is not null
      and nullif(trim(cover_rights_holder),'') is not null
      and cover_rights_basis is not null
      and nullif(trim(cover_permission_evidence),'') is not null
    )
  ),
  constraint articles_publish_check check(
    publication_status<>'published'
    or (published_at is not null and nullif(trim(body_markdown),'') is not null)
  )
);

create table if not exists public.article_places(
  article_id uuid not null references public.articles(id) on delete cascade,
  place_id uuid not null references public.places(id) on delete cascade,
  sort_order integer not null default 0,
  primary key(article_id,place_id)
);

create table if not exists public.article_events(
  article_id uuid not null references public.articles(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  sort_order integer not null default 0,
  primary key(article_id,event_id)
);

create index if not exists articles_destination_published_idx
  on public.articles(destination_id,published_at desc)
  where publication_status='published';
create index if not exists articles_author_id_idx on public.articles(author_id) where author_id is not null;
create index if not exists articles_category_published_idx
  on public.articles(category,published_at desc)
  where publication_status='published';
create index if not exists article_places_place_id_idx on public.article_places(place_id);
create index if not exists article_events_event_id_idx on public.article_events(event_id);

alter table public.editorial_authors enable row level security;
alter table public.articles enable row level security;
alter table public.article_places enable row level security;
alter table public.article_events enable row level security;

create policy "Public read active editorial authors" on public.editorial_authors
  for select using(status='active');
create policy "Admins manage editorial authors" on public.editorial_authors
  for all to authenticated using(public.is_geppao_admin()) with check(public.is_geppao_admin());

create policy "Public read published articles" on public.articles
  for select using(publication_status='published' and published_at<=now());
create policy "Admins manage articles" on public.articles
  for all to authenticated using(public.is_geppao_admin()) with check(public.is_geppao_admin());

create policy "Public read published article places" on public.article_places
  for select using(exists(select 1 from public.articles a where a.id=article_id and a.publication_status='published' and a.published_at<=now()));
create policy "Admins manage article places" on public.article_places
  for all to authenticated using(public.is_geppao_admin()) with check(public.is_geppao_admin());

create policy "Public read published article events" on public.article_events
  for select using(exists(select 1 from public.articles a where a.id=article_id and a.publication_status='published' and a.published_at<=now()));
create policy "Admins manage article events" on public.article_events
  for all to authenticated using(public.is_geppao_admin()) with check(public.is_geppao_admin());

grant select on public.editorial_authors,public.articles,public.article_places,public.article_events to anon,authenticated;
grant insert,update,delete on public.editorial_authors,public.articles,public.article_places,public.article_events to authenticated;

insert into public.destinations(name,slug,province,status) values
  ('พัทยา','pattaya','ชลบุรี','inactive'),
  ('กาญจนบุรี','kanchanaburi','กาญจนบุรี','inactive'),
  ('นครนายก','nakhon-nayok','นครนายก','inactive')
on conflict(slug) do update set name=excluded.name,province=excluded.province;

commit;
