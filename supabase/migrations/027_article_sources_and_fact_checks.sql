-- Structured article provenance and visible fact-check dates for published stories.
begin;

alter table public.articles
  add column if not exists last_fact_checked_at date;

create table if not exists public.article_sources(
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles(id) on delete cascade,
  label text not null check(char_length(trim(label)) between 2 and 160),
  source_url text not null check(source_url ~ '^https://'),
  source_type text not null default 'official' check(source_type in('official','government','owner','primary','reference')),
  checked_at date not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique(article_id,source_url)
);

create index if not exists article_sources_article_id_idx
  on public.article_sources(article_id,sort_order,id);

alter table public.article_sources enable row level security;

create policy "Public read sources for published articles" on public.article_sources
  for select using(exists(
    select 1 from public.articles a
    where a.id=article_id and a.publication_status='published' and a.published_at<=now()
  ));
create policy "Admins manage article sources" on public.article_sources
  for all to authenticated using(public.is_geppao_admin()) with check(public.is_geppao_admin());

grant select on public.article_sources to anon,authenticated;
grant insert,update,delete on public.article_sources to authenticated;

with source_seed(slug,label,source_url,source_type,checked_at,sort_order) as (values
  ('khao-yai-visitor-update-late-2026','Khao Yai National Park — Plan your visit','https://khaoyainationalpark.com/en/plan-your-visit','official','2026-09-27'::date,0),
  ('thailand-earth-trail-sai-yok-october-2026','Tourism Authority of Thailand — Thailand Earth Trail Season 4 @ Sai Yok','https://www.tourismthailand.org/Events-and-Festivals/thailand-earth-trail-season-4-saiyok-2','government','2026-09-27'::date,0),
  ('tomorrowland-thailand-pattaya-2026-trip-update','Tourism Authority of Thailand — Tomorrowland Thailand','https://www.tourismthailand.org/Articles/tomorrowland-en','government','2026-09-27'::date,0)
)
insert into public.article_sources(article_id,label,source_url,source_type,checked_at,sort_order)
select a.id,s.label,s.source_url,s.source_type,s.checked_at,s.sort_order
from source_seed s join public.articles a on a.slug=s.slug
on conflict(article_id,source_url) do update set
  label=excluded.label,
  source_type=excluded.source_type,
  checked_at=excluded.checked_at,
  sort_order=excluded.sort_order;

update public.articles set
  last_fact_checked_at='2026-09-27',
  body_markdown=regexp_replace(body_markdown,E'\\n\\nแหล่งข้อมูลที่ตรวจสอบ: https://[^\\n]+$',''),
  canonical_url='https://geppao.vercel.app/stories/'||slug,
  updated_at=now()
where slug in(
  'khao-yai-visitor-update-late-2026',
  'thailand-earth-trail-sai-yok-october-2026',
  'tomorrowland-thailand-pattaya-2026-trip-update'
);

commit;
