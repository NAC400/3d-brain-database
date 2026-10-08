# MAPPED

MAPPED connects interactive 3D anatomy with scientific research, helping students and researchers explore structures, discover relevant papers, and organise their work.

The long-term aim is to cover **the full anatomy of the human body**. For now, MAPPED is being trialled with **the brain** to test the anatomy and research workflows before expanding to other body systems.

**[Try the web app](https://mapped-brain.pages.dev/)** · **[Contact](mailto:mapped.nac@gmail.com)**

## What you can do

- **Explore the brain in 3D:** browse 233 selectable structures in the bilateral SPL/NAC atlas, search regions, and inspect them with isolation, anatomy layers, explode, and cross-section controls.
- **Build a paper library:** find and import papers through PubMed, Crossref, DOI lookup, or manual entry. Organise papers with projects, topic tags, and brain-region links; papers can also be saved without an anatomical link.
- **Connect research to anatomy:** view research associated with a selected structure and work in personal or community contexts. Community contributions go through moderation.
- **Share selected work:** publish explicit project snapshots containing paper metadata, topics, and anatomical links, while keeping private notes out of the public copy.
- **Join the discussion and give feedback:** use the community forum and in-app feedback survey to help shape the pilot.

## Current scope

MAPPED is an early, desktop-focused pilot. Full-body coverage is a future goal, and the current collections do not represent complete brain or head anatomy.

Alongside the main brain atlas, the explorer includes experimental source views for SPL skull and neck vessels, BodyParts3D central arteries, and Z-Anatomy dural folds and sinuses. These come from different datasets; combined views are illustrative, and their alignment and connections are not yet validated.

Personal workspace data is stored in the browser. Account and community features use Supabase and depend on the deployed database configuration. Recent community features require the migrations documented in [Research workspace changes](https://github.com/NAC400/MAPPED/blob/codex/home-ui-refinement/docs/RESEARCH_WORKSPACE_CHANGES.md); production authentication checks are tracked in the [deployment notes](https://github.com/NAC400/MAPPED/blob/codex/home-ui-refinement/docs/CLOUDFLARE_PAGES_SETUP.md).

## Run locally

The app uses React 19, TypeScript, Three.js, React Three Fiber, Tailwind CSS, Zustand, and Supabase. The frontend is hosted on Cloudflare Pages.

The current app and deployment source is on `codex/home-ui-refinement`. With Node.js and npm installed:

```bash
git clone --branch codex/home-ui-refinement https://github.com/NAC400/MAPPED.git
cd MAPPED
npm ci --prefix frontend
npm start --prefix frontend
```

Open [localhost:3000](http://localhost:3000). For account and community features, configure `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_ANON_KEY` in `frontend/.env.local` using your own Supabase project. Only use the public browser key. See [Supabase setup](https://github.com/NAC400/MAPPED/blob/codex/home-ui-refinement/supabase/README.md) for the schema and migrations.

```bash
# Standard production build
npm run build --prefix frontend

# Cloudflare Pages build (packages the brain model for Pages asset limits)
npm run build:pages --prefix frontend

# Frontend tests
npm test --prefix frontend
```

## Anatomy sources and documentation

Dataset attribution and licence details are available in the app's **Data sources & licences** page, [ATTRIBUTIONS.md](https://github.com/NAC400/MAPPED/blob/codex/home-ui-refinement/ATTRIBUTIONS.md), and the notices bundled with each model. Dataset licences apply to their respective assets; they do not establish a licence for the application code.

- [Explorer source views and guide](https://github.com/NAC400/MAPPED/blob/codex/home-ui-refinement/docs/EXPLORER_SOURCE_VIEWS_AND_GUIDE.md)
- [Research library, projects, and community changes](https://github.com/NAC400/MAPPED/blob/codex/home-ui-refinement/docs/RESEARCH_WORKSPACE_CHANGES.md)
- [Cloudflare Pages deployment](https://github.com/NAC400/MAPPED/blob/codex/home-ui-refinement/docs/CLOUDFLARE_PAGES_SETUP.md)
- [Archived Allen atlas and restoration](https://github.com/NAC400/MAPPED/blob/codex/home-ui-refinement/archive/allen-atlas/README.md)

## Contact

For feedback, questions, or collaboration enquiries: **[mapped.nac@gmail.com](mailto:mapped.nac@gmail.com)**.
