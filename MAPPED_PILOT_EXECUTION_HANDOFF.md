# MAPPED — Pilot decisions and execution handoff

Prepared: 29 September 2026. Status: plan recorded; implementation and verification remain pending.

## 1. How the next assistant should use this document

Read this entire document and applicable repository instructions before starting. Inspect the current checkout, Git status, deployment configuration, and database migrations; do not assume historical chat claims establish current behavior. Preserve unrelated local work.

Execute one phase at a time. Before editing, state its scope and acceptance criteria. After each phase, record changed files, checks performed, outcomes, unresolved issues, and the next step in section 10. Keep tasks unchecked until verified. Use small, coherent commits; follow the user's current publishing instructions and distinguish a successful push from a successful live deployment.

This document records the agreed product direction and proposed implementation sequence. Its creation does not mean any task below has been completed. Do not publish research entries before the owner's final approval, or post recruitment messages without explicit authorization to send them.

## 2. Final product decision

**Pilot hypothesis:** an anatomically organized, curated collection of papers helps students discover useful research. Test the usefulness of the 3D interface rather than assuming visual appeal proves demand.

The original concept combines brain anatomy visualization with research organization and community contributions. The owner's primary ambition is a business with satisfied paying customers; portfolio value is secondary. Pricing and willingness to pay remain unvalidated.

| Decision | Agreed direction |
| --- | --- |
| First audience | Medical, psychology, master's, and PhD students; record background and interpret feedback by group. |
| Recruitment | Initially Reddit, using an honest early-prototype invitation. |
| Access | Direct public website link; browsing without registration; account required to contribute. |
| Seed structures | Hypothalamus, hippocampus, amygdala, nucleus accumbens, cerebellum. |
| Seed depth | Four prominent topics per structure, at least five highly cited and influential papers per topic: at least 100 placements, not necessarily 100 distinct papers. |
| Editorial responsibility | Assistant researches topics and papers; owner gives final approval before publication. |
| Community moderation | Paper + structure + topic + relevance explanation; pending until approved for public display. |
| Automation | Automate objective checks first; evaluate relevance assistance before reducing human review. |
| Feedback | Prominent button linking to a separate short survey; optional follow-up contact. |
| Pilot duration | Two weeks from the actual recruitment post; target ten completed responses. |
| Planning date | October 8, 2026 is an owner's target, not a hard release deadline. |
| Device scope | Initial trial is desktop-focused; mobile limitations must be stated. |
| After trial | Improve, narrow, redirect, or pause based on actual use and repeated needs. |

## 3. Scope boundaries and unresolved choices

Required before testing: useful curated content, reliable guest access, trustworthy contribution handling, understandable navigation, survey/contact access, and verified core flows.

Do not automatically expand this pilot into a replacement for Zotero/Mendeley, a general AI research agent, or a complete medical anatomy suite. These remain potential directions to assess through evidence.

Resolve these details in the relevant phase, not by silently inventing them:

- Current production URL and build/deployment status.
- Four topics per structure and criteria for a meaningful anatomical connection.
- Public contact email, survey service/account, and final survey URL.
- Whether personal work must persist across devices for this pilot; clearly explain any local-only storage.
- Exact project/view switching behavior and whether community/private project mode can ever be changed.
- Donations provider, account eligibility, fees, currency and country support, and owner approval if donations proceed.
- Open-source licensing: the owner expressed interest, but code licensing and third-party content permissions are not settled by public browsing.

## 4. Phase 0 — Establish the actual baseline

- [ ] Inspect repository instructions, active branch/worktree, uncommitted changes, dependencies, and existing audit documents.
- [ ] Map current auth, sources, projects, brain-region links, community contributions, and moderation flows.
- [ ] Establish which data is local-only and which is saved to Supabase.
- [ ] Verify the production URL, configured deployment branch, build commands, and required environment-variable names without disclosing secrets.
- [ ] Reproduce core flows and list blockers with severity and evidence.
- [ ] Establish repeatable type, lint, test, and production-build commands.

Historical context to verify: the app uses React/Three.js, Supabase, and Netlify. The owner reported working login and password reset. Earlier local dependency changes were excluded from commits; reconcile current state carefully. Research search was expanded to PubMed/Crossref, with an external Scholar link. PDF handling was changed, but live end-to-end reliability must be tested.

**Exit check:** a written baseline identifies real blockers, persistence boundaries, and a reproducible validation path.

## 5. Phase 1 — Specify and secure the evidence collection

- [ ] Write the collection and contribution acceptance criteria before implementing schema/UI changes.
- [ ] Define stable structure/topic identifiers and paper-to-structure-to-topic placements, allowing one paper multiple justified placements.
- [ ] Reuse existing schema where appropriate; plan non-destructive migrations and recovery steps.
- [ ] Establish public read access for approved entries and ownership rules for pending submissions.
- [ ] Verify that ordinary users cannot approve contributions or overwrite another user's data, including through direct API requests.
- [ ] Define pending, approved, and rejected/revision-needed behavior, including reviewer notes and attribution.
- [ ] Implement reviewer actions and verify them with separate guest, contributor, and reviewer accounts.
- [ ] Implement identifier validation, metadata matching, duplicate detection, required-field checks, and topic/structure existence checks.
- [ ] Keep automated relevance suggestions distinct from an approval decision; record reasons and uncertainty.

**Exit check:** guests see approved entries, contributors can submit their own work, and publication authority is enforced by the database—not only hidden buttons.

## 6. Phase 2 — Curate the initial collection

- [ ] Research four candidate topics for each of the five structures; explain their significance and overlap.
- [ ] Have the owner approve the topic outline before building the full collection.
- [ ] Select at least five highly cited, influential papers per topic using documented sources and editorial reasoning.
- [ ] Record citation-count provider and retrieval date; do not equate citation count with quality or compare counts without context.
- [ ] Verify bibliographic metadata, paper identity, publication type, and corrections/retractions where discoverable.
- [ ] Write a concise explanation of each placement, distinguishing direct findings from inference and human from animal evidence.
- [ ] Record publisher/repository links and abstract/PDF availability without promising universal full-text access.
- [ ] Prepare a reviewable draft collection; obtain the owner's final approval.
- [ ] Import approved entries without creating duplicate paper records; verify all 20 topic groups and at least 100 placements.

Minimum curation record: title, authors, year, DOI/PMID where available, publication type, citation count/source/date, structure, topic, relevance explanation, evidence population/species where relevant, source links, reviewer and approval status.

**Exit check:** every public placement has a verified paper, an explained anatomical/topic match, and owner approval. AI-generated summaries are never presented as author quotations.

## 7. Phase 3 — Make the pilot understandable and usable

### 3A. Personal/community context

- [ ] Visually distinguish personal and community exploration with clear labels and a modest design difference.
- [ ] Make the active project and its mode visible.
- [ ] Specify and implement deliberate switching behavior so users cannot accidentally leave a project context or confuse private and public work.
- [ ] Verify switching never publishes, moves, or loses data unintentionally.

### 3B. Core research and visual experience

- [ ] Test structure selection, topic navigation, paper discovery, imports, abstracts, citations, and available PDF access with representative real papers.
- [ ] Ensure failures and missing abstracts/PDFs are understandable; never claim a download or verification that was not confirmed.
- [ ] Inspect the anatomical model's labels, structure availability, source/license, and mapping to the five seed structures.
- [ ] Apply a focused visual polish pass: hierarchy, typography, spacing, contrast, readable panels, consistent controls, and loading/error states.
- [ ] Test the main desktop viewport sizes and a smaller laptop screen.
- [ ] On phones, communicate the desktop pilot limitation clearly and avoid trapping users in unusable navigation; plan full mobile support separately.

### 3C. Orientation, feedback, and contact

- [ ] Add a short, skippable 5–7-step introduction on first sign-in, with a way to reopen it; keep guest discovery understandable too.
- [ ] Provide the direct public app link and verify it in a fresh logged-out browser.
- [ ] Select and create the separate survey using an owner-approved account/service.
- [ ] Add a prominent feedback button and verify its destination.
- [ ] Add a contact/help-project link using the owner's confirmed public email.

Survey content: role/course; recent relevant task and current tools; intended use (learning, organizing, discovering, none, other); attempted task and completion; confusing/missing/unnecessary features and why; optional follow-up email. Distinguish pre-trial expectations from post-use experience. Do not make email compulsory.

**Exit check:** a new visitor can discover the sample collection, understand personal/community context, and submit feedback without live coaching.

## 8. Phase 4 — Verify and release the pilot

- [ ] Run the required automated checks and obtain a successful production build.
- [ ] Verify guest browsing, signup, confirmation, login, password reset, contribution submission, approval, and feedback links on the deployed site.
- [ ] Test private-data isolation and approved-only community visibility with distinct accounts.
- [ ] Confirm any promised persistence survives reloads and matches the stated device/account behavior.
- [ ] Document known limitations, data handling, and a rollback/recovery path.
- [ ] Prepare a Reddit invitation describing the actual task, early-stage status, desktop scope, app link, survey link, and expected time commitment.
- [ ] Check selected communities' current self-promotion/research rules and obtain moderator permission when required.
- [ ] Have the owner review the release and recruitment materials; publish the post only with explicit sending authorization.
- [ ] Record the real trial start/end dates when recruitment goes live.

**Release gate:** no unresolved critical access, privacy, data-loss, or moderation failures; the curated collection and survey are usable on production. A commit or successful lint check alone does not satisfy this gate.

## 9. Phase 5 — Learn from the two-week trial

- [ ] Track recruitment channels and response counts without treating low recruitment as proof the product is unwanted.
- [ ] Aim for ten completed responses; group findings by participant background and task.
- [ ] Collect concrete successes, failures, repeated needs, and reported/consensually measured return use.
- [ ] Distinguish enjoyment of the 3D visual from help accomplishing a research or learning task.
- [ ] Summarize what to retain, fix, remove, or investigate next; review with the owner.
- [ ] Choose the next product hypothesis before expanding features or introducing payment plans.

### Deferred or exploratory backlog

- Full mobile layout, touch interaction, and rendering-performance work.
- Additional anatomical layers: dura/meninges, vasculature, skull; assess available assets, scientific accuracy, licensing, and performance first.
- Pathways/connectivity and smoother transitions between systems while maintaining orientation.
- Layered explanations from introductory to advanced, tied to evidence and function.
- AI questions grounded in selected sources, with citations and explicit uncertainty; define a demonstrated user need first.
- More automated relevance review; measure against a human-reviewed sample before allowing any automatic publication.
- Donation/support button: compare appropriate international providers after confirming owner country, eligibility, fees, and desired setup. Optional for the pilot.
- Wider reference-manager integrations, additional databases, and open-source distribution decisions.

### External feedback: leads, not established requirements

The owner's notes report Reddit interest in connecting anatomy to function/research, references and notes, layered explanations, and smooth pathway/system exploration. VOKA.io was mentioned as a design reference, not a specification to copy.

Investigate the CALM-Brain repository through its primary source before considering integration. The supplied news lead was: https://www.thehindu.com/sci-tech/health/indias-first-repository-of-major-psychiatricdisorders-calm-brain-launched-in-bengaluru/article70783618.ece/amp/

Another comment suggested connectomes and “diffusor tomography” and described the brain as a “2D organ.” Treat that wording as unverified feedback, not scientific fact. Clarify the intended imaging/connectivity concepts using authoritative sources if this becomes relevant.

## 10. Execution log and restart point

Current phase: **Phase 0 not started under this plan.**

| Phase/task | Change or finding | Verification/evidence | Remaining issue | Commit/deployment |
| --- | --- | --- | --- | --- |
| Handoff | Recorded decisions and sequenced the owner's to-do notes | Compared against source notes and discussion | Implementation pending | Document only |

At each stopping point record: last completed task; current task; exact files/branch involved; checks and results; decisions still needed; and the next concrete action. Do not rewrite an unresolved item as completed merely because code was added.

Source notes: `C:\Users\neman\OneDrive\Desktop\MAPPED\MAPPED TO DO.txt`. This Markdown document organizes those notes and the agreed pilot decisions; preserve the original text file.
