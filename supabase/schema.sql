-- ============================================================
-- MAPPED — Supabase PostgreSQL Schema
-- Pillar 2: Academic Research Engine
-- Run this entire file in Supabase → SQL Editor → New query
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ============================================================
-- USERS (profile table, extends Supabase auth.users)
-- ============================================================
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  institution  text,
  plan         text not null default 'free',  -- 'free' | 'pro' | 'institutional'
  created_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;
create policy "Users can read own profile"  on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- ============================================================
-- SOURCES (research papers, datasets, links)
-- ============================================================
create table if not exists public.sources (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.profiles(id) on delete cascade,
  title       text not null,
  authors     text[] not null default '{}',
  doi         text,
  url         text,
  abstract    text,
  journal     text,
  year        int,
  tags        text[] not null default '{}',
  is_global   boolean not null default false,  -- contributed to global atlas
  created_at  timestamptz not null default now(),
  -- Full-text search vector (auto-updated by trigger below)
  fts         tsvector generated always as (
    to_tsvector('english',
      coalesce(title,'') || ' ' ||
      coalesce(abstract,'') || ' ' ||
      coalesce(journal,'') || ' ' ||
      coalesce(array_to_string(authors,' '),'') || ' ' ||
      coalesce(array_to_string(tags,' '),'')
    )
  ) stored
);

create index if not exists sources_fts_idx on public.sources using gin(fts);
create index if not exists sources_user_idx on public.sources(user_id);
create index if not exists sources_doi_idx  on public.sources(doi) where doi is not null;

alter table public.sources enable row level security;
-- Users can CRUD their own sources; everyone can read global ones
create policy "Read own or global sources"
  on public.sources for select
  using (auth.uid() = user_id or is_global = true);
create policy "Insert own sources"
  on public.sources for insert
  with check (auth.uid() = user_id);
create policy "Update own sources"
  on public.sources for update
  using (auth.uid() = user_id);
create policy "Delete own sources"
  on public.sources for delete
  using (auth.uid() = user_id);

-- ============================================================
-- STRUCTURE LINKS (many-to-many: sources ↔ brain regions)
-- ============================================================
create table if not exists public.structure_links (
  id                uuid primary key default gen_random_uuid(),
  source_id         uuid not null references public.sources(id) on delete cascade,
  region_mesh_name  text not null,   -- matches GLB mesh name, e.g. "THM_10389"
  region_name       text not null,   -- denormalized display name
  verified          boolean not null default false,
  created_at        timestamptz not null default now(),
  unique(source_id, region_mesh_name)
);

create index if not exists structure_links_source_idx on public.structure_links(source_id);
create index if not exists structure_links_region_idx on public.structure_links(region_mesh_name);

alter table public.structure_links enable row level security;
create policy "Read links for accessible sources"
  on public.structure_links for select
  using (
    exists (
      select 1 from public.sources s
      where s.id = source_id
        and (s.user_id = auth.uid() or s.is_global = true)
    )
  );
create policy "Manage own links"
  on public.structure_links for all
  using (
    exists (
      select 1 from public.sources s
      where s.id = source_id and s.user_id = auth.uid()
    )
  );

-- ============================================================
-- ANNOTATIONS (user notes on regions or sources)
-- ============================================================
create table if not exists public.annotations (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles(id) on delete cascade,
  region_mesh_name  text,    -- null if annotation is on a source, not a region
  source_id         uuid references public.sources(id) on delete cascade,
  body              text not null,   -- markdown
  color             text,            -- optional highlight colour
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists annotations_user_idx   on public.annotations(user_id);
create index if not exists annotations_region_idx on public.annotations(region_mesh_name);

alter table public.annotations enable row level security;
create policy "Users manage own annotations"
  on public.annotations for all
  using (auth.uid() = user_id);

-- ============================================================
-- HELPER: update annotations.updated_at on row update
-- ============================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists annotations_updated_at on public.annotations;
create trigger annotations_updated_at
  before update on public.annotations
  for each row execute procedure public.set_updated_at();
