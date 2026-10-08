# PostHog for MAPPED

The frontend uses the official `posthog-js` SDK. Tracking runs only in production
builds when both configuration values below are present. Cloudflare Web Analytics
continues to work independently.
PostHog starts only after an explicit analytics acceptance. Visitors can reject
with equal prominence and reopen Analytics preferences on any app screen. Rejection
stops future capture and disables/clears SDK persistence. The versioned consent
choice is stored separately in localStorage. No pre-consent activity is replayed.
The privacy notice is available at `/privacy.html` without analytics initialization.
Before public launch, the operator should confirm the legal operator identity and
actual PostHog event retention period; the notice explicitly marks retention as
unverified rather than inventing a period.
The deployment build disables source maps because the SDK's published maps refer
to missing source files and otherwise cause CRA to fail in CI.

## Activate

The owner's EU project is configured in the GitHub workflow using its public
ingestion token and `https://eu.i.posthog.com`. No personal API key is stored.
The local git-ignored `frontend/.env` is configured as well. A deployment of this
change activates collection; live delivery must then be verified in PostHog.
Repository secrets override the workflow defaults if you later switch projects.

1. Create a project at https://app.posthog.com (US) or https://eu.posthog.com (EU).
2. In project settings, copy the **Project API key** and ingestion/API host.
   Use the public project key, not a personal API key.
3. In GitHub repository Settings > Secrets and variables > Actions, add:
   - `REACT_APP_POSTHOG_KEY`: your public project key.
   - `REACT_APP_POSTHOG_HOST`: the ingestion host from PostHog, typically
     `https://eu.i.posthog.com` or `https://us.i.posthog.com`.
4. Deploy the updated frontend through the existing Cloudflare Pages workflow.
   These values are embedded at build time; setting Cloudflare runtime variables
   alone will not configure this GitHub-built static app.
5. Open the production website, visit Explorer, select a region, and create a
   project. Check PostHog's live events view for the events below. Ad blockers may
   block collection; use a browser without blocking for this verification.

For a local production preview, add the same values to the git-ignored
`frontend/.env`, run `npm run build:pages --prefix frontend`, and serve the build.
`npm start` and automated tests do not send analytics.

## Events and useful insights

- `$pageview` with `screen`: initial screen and changes between Home, Explorer,
  Library, Community, Auth and Data Sources. Re-selecting the same screen does not
  add another view. Filter or break down on `screen` in PostHog.
- `region_selected` with `region` and `atlas`: a changed, nonempty selection.
- `project_created`: a project was added to the local workspace.
- `source_saved`: a source was added to the local library.
- `note_saved`: a new structure/source note was added (not every text edit).
- `signup_submitted`: signup returned an account creation response; this does not
  mean the email was verified or signup completed.

Create a funnel from Explorer screen view to region selection to source saving.
Create a seven-day retention insight using `region_selected` or `source_saved`.
Workspace events measure local actions, not confirmed database persistence.
Importing sources or adding a source with existing notes can also emit these events.

## Collection choices

Autocapture, surveys, performance capture and session replay are disabled. No
account identification or person profiles are used. A browser-local anonymous ID
supports return-visit analysis; it does not join the same user across devices and
can reset when browser storage is cleared. Project/source/note text, emails,
passwords and account IDs are not passed to event capture. URL, referrer URL,
pathname and query properties are excluded to protect authentication link tokens.
PostHog still collects its standard device/session metadata. Review your privacy
notice and consent configuration before activating production collection.

To disable collection, remove the workflow defaults and the PostHog repository
secrets (if set), or clear the local build variables, then redeploy.
