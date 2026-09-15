# MAPPED launch audit and execution plan

## Current product understanding

MAPPED is a 3D brain research platform: an interactive anatomical atlas paired
with a personal workspace for literature, notes, and projects. Its intended
community layer lets authenticated researchers contribute evidence, discuss
region-linked questions, and collectively build a curated global atlas.

The core experience is distinctive and worth preserving. The present priority
is turning the prototype data layer into a trustworthy production system before
inviting real users.

## Most important implementation findings

- Adding a source only updates Zustand/localStorage; it never writes to
  Supabase.
- A new authenticated user will not automatically get a `profiles` row,
  although `sources.user_id` references `profiles`. A database trigger is
  needed on auth signup.
- The in-code forum SQL is incomplete and not versioned in
  `supabase/schema.sql`. It also omits a comment-read policy and makes upvotes
  non-atomic.
- Community submissions currently let the browser submit `verified` and AI
  score values. A user must never be able to grant their own contribution
  verified status.
- The Groq API key must move to a Supabase Edge Function or other server-side
  endpoint. It must never be shipped inside the React bundle.
- The app includes older/parallel viewers and placeholder Visible Human slice
  work. The active path is `App -> BrainScene -> BrainModel`; archive, remove,
  or clearly quarantine unused experiments once the app is stable.
- Dataset attribution is documented, but needs to appear in the product's
  About/legal area before public release.

## Recommended execution order

### 1. Make the database real

- Convert the schema into ordered Supabase migrations.
- Add a profile-creation trigger, projects, sources, source-region links,
  notes, highlights, community submissions, forum posts/comments, votes,
  reports, and moderation tables.
- Migrate persisted browser data into Supabase after sign-in.
- Use RLS policies and database tests for every table.

### 2. Establish a safe community workflow

- Community contributions begin as `pending`; only a moderator or trusted
  server-side workflow can publish them.
- Add the roles user, curator, moderator, and admin.
- Add report, hide, review queue, rate limits, and audit-log capabilities.
- Use atomic database RPCs for votes instead of client-side increments.
- Keep public profile data deliberately minimal.

### 3. Harden authentication and privacy

- Enable email confirmation, password reset, CAPTCHA, custom SMTP, production
  redirect URLs, a privacy policy, terms, and community guidelines.
- Use a custom domain and a production Supabase project with backups before a
  public launch.

### 4. Make the product credible for researchers

- Show atlas provenance, version, region identifiers, source citations,
  contributor/reviewer status, and a clear distinction between user claims and
  validated evidence.
- Add exportable citations and stable shareable URLs for regions, sources, and
  discussions.
- Start with a narrow, identifiable audience rather than launching as a
  general social network.

### 5. Make it operable

- Migrate Create React App to Vite.
- Add unit tests for data access and RLS, and end-to-end tests for signup,
  source import, region linking, contribution submission, and moderation.
- Add CI, error monitoring, privacy-conscious analytics, performance tracking,
  and a staging deployment.
- Replace browser-direct PubMed/Crossref requests with cached server endpoints
  as traffic grows.

## First launch milestone

A researcher can sign up, create a source and region link, see that private
data on another device, submit a contribution, and have it safely reviewed and
published. This is the minimum trustworthy loop from which MAPPED can grow a
real user base.
