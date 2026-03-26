// TODO: supabase.ts — Supabase client initialisation.
//
// Set up when we reach Phase 2 (Academic Research Engine).
//
// Steps:
//  1. npm install @supabase/supabase-js
//  2. Add REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY to .env
//  3. Uncomment the code below.
//
// Tables to create in Supabase dashboard:
//   - brain_regions       (mirrors BrainRegion type, source of truth for metadata)
//   - research_sources    (papers, datasets, links per region)
//   - annotations         (user-created region annotations)
//   - community_posts     (Phase 3 — Community Platform)
//
// import { createClient } from '@supabase/supabase-js';
//
// const supabaseUrl = process.env.REACT_APP_SUPABASE_URL!;
// const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY!;
//
// export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export {};
