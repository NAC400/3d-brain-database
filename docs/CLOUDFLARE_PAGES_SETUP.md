# MAPPED on Cloudflare Pages (without R2)

Prepared 6 October 2026. Published at https://mapped-brain.pages.dev/ through
Cloudflare Pages Direct Upload, project `mapped-brain`. All 57 files uploaded
successfully. Public authentication redirects still require verification and
Supabase dashboard sign-in.

## How the brain fits Pages

The canonical SPL/NAC GLB is 47,101,752 bytes. Gzip produced 29,117,834 bytes,
still above Pages' 25 MiB per-file limit. Instead of simplifying or quantizing
the brain, the Pages build converts its container to standard glTF JSON with
two external binary buffers (25,094,880 and 21,801,744 bytes). Three.js already
supports this format. No custom decompressor or runtime dependency is needed.

The original GLB in `frontend/public` remains unchanged. Only its oversized
copy in the Pages build is removed. Ordinary builds continue using the GLB;
the Pages build sets `REACT_APP_PAGES_BUILD=true` to select the packaged model.
The archived Allen atlas remains archived.

`prepare-pages-assets.cjs` checks every one of the 699 buffer views byte for
byte and compares all remaining scene metadata. `verify-pages-model.mjs`
loads both formats through Three.js and checks all 233 meshes, attributes,
indices, node transforms, and materials. It also reports local parsing times;
these are not a measurement of live Cloudflare network performance.

## Rebuild locally

From the repository root:

```powershell
npm ci --prefix frontend
node scripts/build-pages.cjs
node scripts/verify-pages-model.mjs
Compress-Archive -Path frontend/build/* -DestinationPath artifacts/mapped-pages-upload.zip -Force
```

The existing frontend `.env` must contain the production
`REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_ANON_KEY`. These are public
browser configuration; never include a Supabase service-role key.
Do not upload `.env`, source directories, or the whole repository.

The frontend pins CRA (`react-scripts`) to 5.0.1, with its dependency lockfile
committed. The Pages build resolves that frontend installation and does not
require the separate local root package. You can also run
`npm run build:pages --prefix frontend` from the repository root.

## First deployment using the Cloudflare dashboard

1. Sign in or create a Cloudflare account and verify the email if requested.
   Stay on Free; do not enable R2 or a paid Workers plan.
2. Go to **Workers & Pages**, choose **Create application**, then select the
   **Pages** option and **Upload assets / Drag and drop**. Dashboard wording
   can change: choose Pages, not a Workers deployment.
3. Choose an available project name, for example `mapped-brain`.
4. Upload `artifacts/mapped-pages-upload.zip`. Its root contains `index.html`,
   `static`, and `models`; no enclosing `build` folder is needed.
5. Verify there are no rejected files before choosing **Deploy site**.
6. Record the actual assigned `https://<project>.pages.dev` URL.
7. Keep the Netlify deployment as the rollback while testing the Pages URL.

A Direct Upload project has no built-in Git connection. It can still receive
automatic deployments through GitHub Actions and Wrangler, retaining the
same project and address. The workflow in `.github/workflows/deploy-pages.yml`
implements this; it requires the secrets below before it can run successfully.

## Automatic deployment from GitHub

Pushes changing frontend/build-related files on `codex/home-ui-refinement`
trigger a clean frontend install, production build, byte-for-byte model checks,
and a Wrangler upload to the existing `mapped-brain` project. Wrangler uses
`--branch=main`, the project's verified production environment; this does not
mean the GitHub source branch is renamed. Other branches cannot deploy this
workflow to production. Manual dispatch is also supported from that source branch.

Required repository Actions secrets:

- `CLOUDFLARE_API_TOKEN`: account-scoped token granting only Cloudflare Pages Write.
- `CLOUDFLARE_ACCOUNT_ID`: the account containing the `mapped-brain` project.
- `REACT_APP_SUPABASE_URL`: existing public frontend project URL.
- `REACT_APP_SUPABASE_ANON_KEY`: existing public frontend anon/publishable key.

Never put a Cloudflare token or Supabase service-role key in committed files.
The workflow checks that all required values are present before building; it
does not fall back to a database-free build. A failed build or geometry check
does not upload a replacement, leaving the current deployment available.

Automatic deployment is prepared locally but not yet activated or verified.
Credential creation requires the owner's confirmation. After secrets are set,
push the workflow and verify a successful Actions run plus the live brain view.

GitHub Actions has its own usage allowances; this does not enable a paid plan.
Reference: [Cloudflare continuous deployment guide](https://developers.cloudflare.com/pages/how-to/use-direct-upload-with-continuous-integration/).

## Supabase configuration after the URL exists

In Supabase **Authentication > URL Configuration**:

- Add the exact Pages root URL and
  `https://<project>.pages.dev/?reset-password=true` to allowed redirects.
- Keep the existing Netlify URLs during validation.
- When Pages becomes the primary site, set **Site URL** to its root URL so
  signup confirmations use the new site.
- For temporary preview domains, add only the previews needed for testing;
  avoid unnecessarily broad production redirect wildcards.

Verify custom SMTP and its message-rate allowance before inviting public
signups. Hosting migration does not remove Supabase's email limits.

## Acceptance checks on the live site

- Guest homepage and explorer open without registration.
- The bilateral brain renders and region search/selection, isolation,
  rotation, zoom, explode, clipping, and layers work.
- Skull/vessels, central arteries, and dural folds/sinuses load.
- Research and licence/provenance pages work.
- Signup confirmation, existing login, logout, and password reset return
  to the intended Pages site.
- Reloads and saved browser state behave as before. Browser-local data is
  origin-specific: data at the Netlify address does not automatically appear
  at the Pages address. Keep the old address available and plan export/import
  if existing users need to carry local-only data across.
- Compare uncached loading on Pages with Netlify on the same device/network.
  The package preserves model content, but live speed must be measured.

Do not remove Netlify or announce the new address until these checks pass.

## Local verification results

- Production build passed with the existing missing MediaPipe source-map warning.
- Dependency follow-up: restored the frontend CRA 5.0.1 pin, regenerated the
  lockfile, and verified a clean `npm ci --ignore-scripts --offline` install.
  `npm run build:pages --prefix frontend` then compiled successfully without
  the previous source-map warning. All 699 buffers remain identical.
- 699 geometry buffer views identical; Three.js scenes identical, 233 meshes.
- Deployment output: 56 files before the verification report, largest file
  25,094,880 bytes (below 26,214,400-byte Pages limit).
- Upload ZIP: approximately 40.8 MB.
- Local browser smoke checks passed: guest homepage, bilateral brain rendering,
  right hippocampus search/selection/isolation, and the three optional anatomy
  source views. No browser console errors or warnings appeared during these checks.
- Source switching after isolation retains the existing camera behavior; this
  hosting change does not repair deferred camera continuity issues. Live
  loading speed comparisons and public authentication remain unverified.

## Live deployment verification

Cloudflare confirmed successful deployment at https://mapped-brain.pages.dev/.
Live browser checks passed for the guest homepage, bilateral brain rendering,
right hippocampus search/selection/isolation, SPL skull and neck vessels,
BodyParts3D central arteries, and Z-Anatomy folds/sinuses. No browser console
errors or warnings appeared during these checks. Evidence screenshot:
`artifacts/pages-live-brain.jpg`.

No production login credentials were supplied, so existing login, signup,
confirmation and recovery tests remain pending. Supabase's dashboard was
signed out; the owner was asked to sign in. Next step: inspect the project's
existing Authentication URL Configuration and add the Pages root and recovery
URL before changing the primary Site URL. Keep Netlify available throughout.

## Official references

- [Pages limits](https://developers.cloudflare.com/pages/platform/limits/)
- [Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/)
- [Serving Pages and SPA routing](https://developers.cloudflare.com/pages/configuration/serving-pages/)
- [Supabase redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)

No paid subscription, R2 bucket, custom domain, or DNS change has been created.
The Cloudflare Pages project is live; the Netlify project was not altered.
