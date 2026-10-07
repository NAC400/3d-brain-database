-- Explicitly published project snapshots. Private workspace tables stay private.
create table if not exists public.community_projects (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  description text check (char_length(description) <= 4000),
  color text not null default '#3b82f6' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  papers jsonb not null default '[]'::jsonb check (jsonb_typeof(papers) = 'array'),
  updated_at timestamptz not null default now()
);
alter table public.community_projects enable row level security;
create policy "Anyone reads published projects" on public.community_projects for select using (true);
create policy "Owners publish projects" on public.community_projects for insert with check (auth.uid() = user_id);
create policy "Owners update published projects" on public.community_projects for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Owners unpublish projects" on public.community_projects for delete using (auth.uid() = user_id);
create index if not exists community_projects_updated_idx on public.community_projects(updated_at desc);
grant select on public.community_projects to anon, authenticated;
grant insert, update, delete on public.community_projects to authenticated;
