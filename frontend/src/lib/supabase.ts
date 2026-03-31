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

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const url = process.env.REACT_APP_SUPABASE_URL;
const key = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient | null =
  url && key ? createClient(url, key) : null;

export const isSupabaseConfigured = (): boolean => !!supabase;
