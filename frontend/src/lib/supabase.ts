/**
 * Supabase client — Pillar 2 Academic Research Engine
 *
 * Setup steps:
 *  1. Create a project at supabase.com (free tier is sufficient for MVP)
 *  2. Go to Project Settings → API and copy:
 *       - Project URL       → REACT_APP_SUPABASE_URL
 *       - anon/public key   → REACT_APP_SUPABASE_ANON_KEY
 *  3. Create frontend/.env (git-ignored) with those two values:
 *       REACT_APP_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
 *       REACT_APP_SUPABASE_ANON_KEY=eyJhbGci...
 *  4. Paste supabase/schema.sql into the Supabase SQL editor and run it
 *  5. Restart the dev server — the client will connect automatically
 *
 * When env vars are absent the client is null and the app falls back to
 * local in-memory state (fully functional without a database).
 */

import { createClient, SupabaseClient, type User } from '@supabase/supabase-js';

const url = process.env.REACT_APP_SUPABASE_URL;
const key = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient | null =
  url && key ? createClient(url, key) : null;

export const isSupabaseConfigured = (): boolean => !!supabase;

// ---------------------------------------------------------------------------
// Auth helpers (Phase 3A)
// ---------------------------------------------------------------------------

export async function signInWithEmail(email: string, password: string) {
  if (!supabase) return { error: { message: 'Supabase not configured. Add REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY to .env' }, data: null };
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUpWithEmail(email: string, password: string) {
  if (!supabase) return { error: { message: 'Supabase not configured.' }, data: null };
  return supabase.auth.signUp({ email, password });
}

export async function signOut() {
  if (!supabase) return;
  await supabase.auth.signOut();
}

export async function getSession() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export function onAuthStateChange(callback: (user: User | null) => void): () => void {
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });
  return () => data.subscription.unsubscribe();
}

// ---------------------------------------------------------------------------
// Global Atlas DB types + helpers (Phase 3C)
// ---------------------------------------------------------------------------

export interface GlobalContribution {
  id:          string;
  user_id:     string;
  source_id:   string;
  region_name: string;
  mesh_name:   string;
  title:       string;
  authors:     string;
  journal?:    string;
  year?:       number;
  doi?:        string;
  abstract?:   string;
  verified:    boolean;
  ai_score:    number;          // Groq relevance score 0–100
  created_at:  string;
}

export async function submitGlobalContribution(
  contribution: Omit<GlobalContribution, 'id' | 'created_at'>
) {
  if (!supabase) return { error: { message: 'Supabase not configured.' } };
  return supabase.from('global_contributions').insert(contribution);
}

export async function fetchGlobalContributions(limit = 50): Promise<GlobalContribution[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from('global_contributions')
    .select('*')
    .eq('verified', true)
    .order('created_at', { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function fetchContributionsByRegion(meshName: string): Promise<GlobalContribution[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from('global_contributions')
    .select('*')
    .eq('mesh_name', meshName)
    .eq('verified', true);
  return data ?? [];
}

// ---------------------------------------------------------------------------
// Forum (Phase 3D)
// ---------------------------------------------------------------------------
// Required SQL (run in Supabase SQL editor):
//
// create table forum_posts (
//   id          uuid primary key default gen_random_uuid(),
//   user_id     uuid references auth.users not null,
//   user_email  text,
//   title       text not null,
//   body        text,
//   region_name text,
//   mesh_name   text,
//   tags        text[],
//   upvotes     int default 0,
//   created_at  timestamptz default now()
// );
// alter table forum_posts enable row level security;
// create policy "Anyone can read posts" on forum_posts for select using (true);
// create policy "Auth users can insert posts" on forum_posts for insert with check (auth.uid() = user_id);
// create policy "Authors can update posts" on forum_posts for update using (auth.uid() = user_id);
//
// create table forum_comments (
//   id          uuid primary key default gen_random_uuid(),
//   post_id     uuid references forum_posts on delete cascade not null,
//   user_id     uuid references auth.users not null,
//   user_email  text,
//   body        text not null,
//   upvotes     int default 0,
//   created_at  timestamptz default now()
// );
// alter table forum_comments enable row level security;
// create policy "Anyone can read comments" on forum_comments for select using (true);
// create policy "Auth users can insert comments" on forum_comments for insert with check (auth.uid() = user_id);

export interface ForumPost {
  id:          string;
  user_id:     string;
  user_email:  string;
  title:       string;
  body?:       string;
  region_name?: string;
  mesh_name?:  string;
  tags?:       string[];
  upvotes:     number;
  created_at:  string;
  comment_count?: number;  // joined/computed
}

export interface ForumComment {
  id:         string;
  post_id:    string;
  user_id:    string;
  user_email: string;
  body:       string;
  upvotes:    number;
  created_at: string;
}

export async function fetchForumPosts(limit = 50): Promise<ForumPost[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from('forum_posts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function createForumPost(post: Omit<ForumPost, 'id' | 'created_at' | 'upvotes' | 'comment_count'>) {
  if (!supabase) return { error: { message: 'Supabase not configured.' } };
  return supabase.from('forum_posts').insert({ ...post, upvotes: 0 });
}

export async function upvoteForumPost(id: string, currentUpvotes: number) {
  if (!supabase) return { error: { message: 'Supabase not configured.' } };
  return supabase.from('forum_posts').update({ upvotes: currentUpvotes + 1 }).eq('id', id);
}

export async function fetchForumComments(postId: string): Promise<ForumComment[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from('forum_comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });
  return data ?? [];
}

export async function createForumComment(comment: Omit<ForumComment, 'id' | 'created_at' | 'upvotes'>) {
  if (!supabase) return { error: { message: 'Supabase not configured.' } };
  return supabase.from('forum_comments').insert({ ...comment, upvotes: 0 });
}
