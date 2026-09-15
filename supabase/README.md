# Supabase deployment

`schema.sql` is the original prototype schema. New production changes live in
the ordered `migrations/` directory and should be deployed through the
Supabase CLI, never copied piecemeal from UI components.

## Before applying the first migration

1. Create separate Supabase projects for staging and production.
2. In Supabase Authentication, set the production Site URL and allowed redirect
   URLs, enable email confirmation, CAPTCHA, and a custom SMTP provider.
3. Put only `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_ANON_KEY` in the
   frontend environment. Never put a service-role key or AI-provider key in
   the browser.
4. Back up an existing production database before applying any migration.

## Deploy

For a new project, first run [`schema.sql`](schema.sql) in the Supabase SQL
Editor. It creates the original profiles, sources, structure-links, and
annotations tables. Then install and authenticate the Supabase CLI, link the
intended project, and apply the production-foundation migration:

```powershell
supabase db push
```

Apply to staging first. Validate signup, private workspace CRUD, a pending
contribution, moderator approval, forum posting, comment creation, vote toggle,
and report creation before deploying the same migration to production.

## Initial administrator

The first administrator must be assigned directly in the Supabase SQL editor
after that person has signed up:

```sql
update public.profiles set role = 'admin' where id = '<AUTH_USER_UUID>';
```

Do not expose a client-side role-management control until an audited admin UI
exists.
