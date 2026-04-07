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
