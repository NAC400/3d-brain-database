# MAPPED — Project context

Recovered on 30 September 2026 from the chat **Confirm MAPPED APP visibility (2)** and its saved handoff. This file summarizes product intent, not verified implementation status.

## Purpose

MAPPED is a web-based neuroscience research and learning platform connecting interactive brain anatomy with an anatomically organized, community-curated collection of scientific papers. The owner's primary ambition is a business with satisfied paying customers; portfolio value is secondary. Demand and pricing remain unvalidated.

The immediate pilot tests whether a curated anatomical paper collection helps students discover useful research. The usefulness of the 3D interface is a hypothesis to test.

## Audience and core workflows

- Initial audience: medical, psychology, master's, and PhD students; compare feedback by background.
- Guest discovery: open the public website without registration, explore brain structures/topics, and discover approved papers with relevance explanations.
- Contributions: sign in, submit a paper linked to a structure and topic, and explain the connection. Submissions remain pending until owner approval.
- Curation: the assistant proposes topics, verifies papers and metadata, and prepares placements; the owner approves before publication.
- Personal work: distinguish personal and community contexts clearly; switching must not accidentally publish, move, or lose data. Exact persistence and switching behavior require verification.
- Feedback: a prominent link to a separate short survey covering real tasks, completion, usefulness, problems, and desired improvements; optional follow-up contact.

## Pilot scope

Five seed structures: hypothalamus, hippocampus, amygdala, nucleus accumbens, and cerebellum. Four topics per structure and at least five highly cited, influential papers per topic: at least 100 placements, potentially sharing paper records.

Desktop-focused trial, initially recruited through Reddit. Run for two weeks after the actual recruitment post, aiming for ten completed responses. October 8, 2026 is a planning target, not a hard deadline. Use evidence of actual tasks and repeat use to decide the next direction.

AI research assistance, full mobile support, additional anatomical layers, broad reference-manager integrations, licensing, and monetization remain deferred or unresolved. Public community contributions do not establish open-source code licensing.

## Detailed plan and restart point

Implementation update, 4 October 2026: Explorer defaults to a genuine bilateral SPL/NAC brain with 233 selectable structures. The footer atlas selector retains the Allen model for existing research links; saved data has not been automatically mapped between atlases. See `docs/ANATOMY_UPGRADE_ASSESSMENT.md` and `frontend/public/models/spl-nac/manifest.json` for provenance, implemented scope, and the verified skull/vessel candidates. Skull, vessels, and meninges are not yet integrated. The owner deferred the old-model transform investigation, camera continuity repairs, and performance optimization to focus on bilateral anatomy and subsequent layers.

Read [MAPPED_PILOT_EXECUTION_HANDOFF.md](./MAPPED_PILOT_EXECUTION_HANDOFF.md) for agreed decisions, incremental phases, acceptance checks, unresolved questions, and the execution log. Copied unchanged from `C:\Users\neman\OneDrive\Desktop\MAPPED\MAPPED_PILOT_EXECUTION_HANDOFF.md`; the repository copy is the reference for future work here.

The handoff was prepared on 29 September 2026 and says implementation under that plan is pending. Later UI work exists in another chat, so do not treat its unchecked tasks as a current audit. Inspect the active checkout and verify behavior before marking tasks complete. The older root README also contains historical claims that need verification.

Future prompt: **Read CONTEXT.md and MAPPED_PILOT_EXECUTION_HANDOFF.md, inspect the current project, then help me with [task].**
