-- MAPPED production foundation
-- Apply with the Supabase CLI (`supabase db push`) or the SQL editor.
-- This migration is additive to supabase/schema.sql and is safe to run once.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Identity and roles
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists role text not null default 'user'
    check (role in ('user', 'curator', 'moderator', 'admin')),
  add column if not exists bio text,
  add column if not exists updated_at timestamptz not null default now();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.is_staff()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('curator', 'moderator', 'admin')
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- A client must not be able to promote itself by writing profiles.role.
create or replace function public.prevent_profile_role_change()
returns trigger language plpgsql as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'Only admins can change a profile role';
  end if;
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_role_guard on public.profiles;
create trigger profiles_role_guard before update on public.profiles
  for each row execute procedure public.prevent_profile_role_change();

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users update safe profile fields" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- Private research workspace
-- ---------------------------------------------------------------------------
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade default auth.uid(),
  name text not null check (char_length(name) between 1 and 120),
  description text,
  color text not null default '#3b82f6' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists projects_user_idx on public.projects(user_id);
alter table public.projects enable row level security;
create policy "Users manage own projects" on public.projects for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table public.sources
  add column if not exists project_id uuid references public.projects(id) on delete set null,
  add column if not exists pmid text,
  add column if not exists notes jsonb not null default '[]'::jsonb,
  add column if not exists updated_at timestamptz not null default now();
create index if not exists sources_project_idx on public.sources(project_id);

create or replace function public.set_row_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
drop trigger if exists projects_updated_at on public.projects;
create trigger projects_updated_at before update on public.projects
  for each row execute procedure public.set_row_updated_at();
drop trigger if exists sources_updated_at on public.sources;
create trigger sources_updated_at before update on public.sources
  for each row execute procedure public.set_row_updated_at();

create table if not exists public.region_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade default auth.uid(),
  mesh_name text not null,
  body text not null default '',
  versions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists region_notes_user_mesh_idx on public.region_notes(user_id, mesh_name);
alter table public.region_notes enable row level security;
create policy "Users manage own region notes" on public.region_notes for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.region_highlights (
  user_id uuid not null references public.profiles(id) on delete cascade default auth.uid(),
  mesh_name text not null,
  color text not null check (color ~ '^#[0-9A-Fa-f]{6}$'),
  updated_at timestamptz not null default now(),
  primary key (user_id, mesh_name)
);
alter table public.region_highlights enable row level security;
create policy "Users manage own region highlights" on public.region_highlights for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Curated global atlas. Contributions are private until staff approval.
-- ---------------------------------------------------------------------------
create table if not exists public.global_contributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade default auth.uid(),
  source_id uuid not null references public.sources(id) on delete cascade,
  region_name text not null,
  mesh_name text not null,
  title text not null,
  authors text not null default '',
  journal text,
  year integer check (year between 1600 and 2100),
  doi text,
  abstract text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  verified boolean not null default false,
  ai_score integer check (ai_score between 0 and 100),
  reviewer_id uuid references public.profiles(id) on delete set null,
  review_note text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  unique(source_id, mesh_name)
);
create index if not exists global_contributions_region_idx on public.global_contributions(mesh_name);
create index if not exists global_contributions_status_idx on public.global_contributions(status, created_at desc);
alter table public.global_contributions enable row level security;
create policy "Anyone reads approved contributions" on public.global_contributions for select
  using (verified = true or auth.uid() = user_id or public.is_staff());
create policy "Users submit pending contributions" on public.global_contributions for insert
  with check (
    auth.uid() = user_id and verified = false and status = 'pending'
    and exists (select 1 from public.sources s where s.id = source_id and s.user_id = auth.uid())
  );
create policy "Users edit own pending contributions" on public.global_contributions for update
  using (auth.uid() = user_id and status = 'pending')
  with check (auth.uid() = user_id and status = 'pending' and verified = false);
create policy "Staff review contributions" on public.global_contributions for update
  using (public.is_staff()) with check (public.is_staff());
create policy "Users remove own pending contributions" on public.global_contributions for delete
  using (auth.uid() = user_id and status = 'pending');

-- ---------------------------------------------------------------------------
-- Community discussion, votes, reports and moderation trail
-- ---------------------------------------------------------------------------
create table if not exists public.forum_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade default auth.uid(),
  user_email text,
  title text not null check (char_length(title) between 1 and 200),
  body text not null check (char_length(body) between 1 and 10000),
  region_name text,
  mesh_name text,
  tags text[] not null default '{}',
  upvotes integer not null default 0 check (upvotes >= 0),
  is_hidden boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- These ALTERs support databases where the earlier inline forum setup was run.
alter table public.forum_posts
  add column if not exists user_email text,
  add column if not exists upvotes integer not null default 0 check (upvotes >= 0),
  add column if not exists is_hidden boolean not null default false,
  add column if not exists updated_at timestamptz not null default now();
create index if not exists forum_posts_created_idx on public.forum_posts(created_at desc);
create index if not exists forum_posts_mesh_idx on public.forum_posts(mesh_name);
alter table public.forum_posts enable row level security;
drop policy if exists "Authors can update posts" on public.forum_posts;
create policy "Anyone reads visible posts" on public.forum_posts for select using (not is_hidden or public.is_staff());
create policy "Authenticated users create posts" on public.forum_posts for insert with check (auth.uid() = user_id);
-- Post editing is intentionally omitted for the first public release. It avoids
-- allowing clients to alter denormalized vote counters or moderation fields.
create policy "Staff moderate posts" on public.forum_posts for update using (public.is_staff()) with check (public.is_staff());
create policy "Authors delete own posts" on public.forum_posts for delete using (auth.uid() = user_id);

create table if not exists public.forum_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.forum_posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade default auth.uid(),
  user_email text,
  body text not null check (char_length(body) between 1 and 5000),
  upvotes integer not null default 0 check (upvotes >= 0),
  is_hidden boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.forum_comments
  add column if not exists user_email text,
  add column if not exists upvotes integer not null default 0 check (upvotes >= 0),
  add column if not exists is_hidden boolean not null default false,
  add column if not exists updated_at timestamptz not null default now();
create index if not exists forum_comments_post_idx on public.forum_comments(post_id, created_at);
alter table public.forum_comments enable row level security;
create policy "Anyone reads visible comments" on public.forum_comments for select using (not is_hidden or public.is_staff());
create policy "Authenticated users create comments" on public.forum_comments for insert
  with check (auth.uid() = user_id and exists (select 1 from public.forum_posts p where p.id = post_id and not p.is_hidden));
create policy "Authors edit own comments" on public.forum_comments for update using (auth.uid() = user_id and not is_hidden) with check (auth.uid() = user_id and not is_hidden);
create policy "Staff moderate comments" on public.forum_comments for update using (public.is_staff()) with check (public.is_staff());
create policy "Authors delete own comments" on public.forum_comments for delete using (auth.uid() = user_id);

create table if not exists public.forum_post_votes (
  post_id uuid not null references public.forum_posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade default auth.uid(),
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
alter table public.forum_post_votes enable row level security;
create policy "Users manage own post votes" on public.forum_post_votes for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.content_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade default auth.uid(),
  post_id uuid references public.forum_posts(id) on delete cascade,
  comment_id uuid references public.forum_comments(id) on delete cascade,
  reason text not null check (char_length(reason) between 1 and 1000),
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  reviewer_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  check ((post_id is not null)::integer + (comment_id is not null)::integer = 1)
);
alter table public.content_reports enable row level security;
create policy "Users create reports" on public.content_reports for insert with check (auth.uid() = reporter_id);
create policy "Users read own reports" on public.content_reports for select using (auth.uid() = reporter_id or public.is_staff());
create policy "Staff resolve reports" on public.content_reports for update using (public.is_staff()) with check (public.is_staff());

-- The client only calls this atomic RPC; it never updates a post counter.
create or replace function public.toggle_post_vote(target_post_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare voted boolean;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  delete from public.forum_post_votes where post_id = target_post_id and user_id = auth.uid();
  if found then
    update public.forum_posts set upvotes = greatest(0, upvotes - 1) where id = target_post_id;
    return false;
  end if;
  insert into public.forum_post_votes(post_id, user_id) values (target_post_id, auth.uid());
  update public.forum_posts set upvotes = upvotes + 1 where id = target_post_id;
  return true;
end;
$$;
revoke all on function public.toggle_post_vote(uuid) from public;
grant execute on function public.toggle_post_vote(uuid) to authenticated;
