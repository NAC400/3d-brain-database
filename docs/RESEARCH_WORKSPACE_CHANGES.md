# Research workspace and engagement changes

## Library

The library can discover and import papers through PubMed, Crossref, DOI lookup,
and manual entry without a brain-region link. Existing DOI/PMID imports are
rejected as duplicates. Projects, topic tags, brain-region filters, and bulk
filing reuse the existing local workspace data. Topic tags are flat, not nested
folders. Project settings are accessible from Library, with Personal and
Community workspace choices.

## Explorer and projects

Personal/Community controls appear while Research is open. Without a selected
region, Research defaults to Projects. Selecting a project opens its workspace;
changing its mode retains its papers. Local projects remain accessible when
the public project service fails. Empty projects open with an Add paper path
through Library. Shared projects are explicit public snapshots containing paper
metadata, topics, and brain links; private notes are excluded. Updating the
public copy is explicit. Switching a known published project to Personal removes
its public snapshot before saving the change.

## Anatomy layers

SPL labels use “thalamic” and “subthalamic,” which the old Allen-oriented string
matches missed. Shared classification now handles these labels, geniculate
bodies, pulvinar, and pineal structures. Layer groups select their available
structures, and separate disclosure controls select subdivisions. Absent
subdivisions are omitted. Regression checks cover all 233 SPL meshes and every
available layer. Layer colors now use valid hex values when opacity is appended.

## Engagement deletion

Authors can delete their forum threads, comments, and atlas contributions after
confirmation. Visitors and other authors have no delete controls. The database
checks authenticated ownership with RLS; client deletes also filter by owner and
require a returned deleted row. Failed operations keep content visible and show
a retryable error. Deleting a thread cascades its replies, votes, and reports;
local session threads also remove their replies. Research contribution cards and
the atlas page use the same deletion flow. Published projects already provide
Unpublish, and votes already use a server-side toggle.

## Database rollout

Apply these migrations after the production foundation migration:

- `supabase/migrations/202610070001_community_projects.sql`
- `supabase/migrations/202610070002_author_engagement_deletion.sql`

The second migration permits authors to withdraw their contributions at any
moderation status. Database migrations require deployment separately from the
frontend; they have not been applied to a hosted database from this workspace.

## Verification

Targeted React tests cover unlinked imports, duplicate prevention, bulk topics,
project mode changes, public service failures, snapshot privacy and validation,
all SPL layers, and author-only confirmed deletion with cancellation, errors,
and local thread cleanup. TypeScript and the production build are also checked.
