# Admin overhaul workflow

This document is the durable source of truth for the admin overhaul. Agents
should read it after conversation compaction and before starting or resuming an
admin-overhaul chunk. Update the status table and next-step notes in the same
branch as every chunk.

## Outcomes and fixed decisions

- Main navigation stays in the left sidebar, grouped into Operations, Source
  Data, and Content, with Museum as its own top-level destination because Museum
  owns an internal subtab system. Horizontal tabs are reserved for nested
  workflows and subsections, not site-wide admin destinations.
- Roles are additive. Named roles are presets over server-enforced capabilities.
- Site Admin has unrestricted access, user management, and destructive actions.
- Data Admin is an Editor plus source-data, import, and reconciliation authority.
- Editor can edit and publish content. Fact-checker works with structured
  summaries; Writer also works with biography and long-form content. Neither
  role can publish. Curator can fully manage Museum and the full Saint catalog,
  while destructive Museum actions remain Site Admin-only. Translator remains
  view-only until translation workflows are designed.
- Existing allowlisted emails are grandfathered as Site Admins during the
  one-time bootstrap. Runtime access is database-backed through Users & Access.
- Several admins may work on one item. The finished system needs both presence
  indicators and optimistic conflict protection; conflict protection comes first.
- Assignments cover Saints, Traditions, Places, and Instagram posts from launch.
- Translation authoring and its language/version model are explicitly deferred.

## Status

| Chunk | Status | Delivered scope |
| --- | --- | --- |
| 1. Roles and navigation foundation | Deployed | Additive roles/capabilities, grouped permission-aware navigation, Users & Access baseline, Source Data split, top-level Museum, OAuth account-link hotfix |
| 2. Detail review simplification | Deployed | Shared task tabs, session-persistent collapsible navigation, calmer default expansion, smaller review imagery |
| 3. Authorization enforcement | Deployed | Content/preview route gates, API/action capability audit, publish/archive boundary, destructive-action boundary, capability-matrix tests |
| 4. Users & Access completion | Deployed | User approval by email, additive roles, activation/deactivation, access audit, last sign-in, inline feedback, destructive-action settings relocation, bootstrap-only allowlist confirmation |
| 5. Source Data and reconciliation | Deployed | Source Data overview, unified reconciliation queue and import history, unresolved badge, preserved context comparison, recorded safe decisions and follow-up queueing |
| 6. Assignments and dashboards | Deployed | Cross-content assignments, self-claim and lifecycle actions, personalized dashboard/counts, My Work, Available, Blocked, Completed, authorized Team Workload |
| 7. Conflict protection and presence | Deployed | Versioned top-level editorial saves, durable current-versus-attempted conflict UI, preconditioned reapply, expiring advisory viewer/editor presence |
| 8. Museum hardening | Deployed | Direct-route capability audit, sandboxed private family trees, Curator/Site Admin mutation guard seam, curator-only dashboard and main-admin return path, explicit planning-preview status |
| 9. Final UX/accessibility pass | Deployed | Shared unsaved-change protection and validation summary, keyboard/focus improvements, sticky primary task navigation, narrow-laptop safeguards |
| 10. Translation workflow | Deferred | Language/version model, translation editing/review/publication and fallback behavior |
| R1. Navigation remediation | Deployed | Grouped left-sidebar destinations, nested workflow subtabs only, active route state, and honest section-jump navigation semantics |
| R2. Airtable consolidation | Deployed | Complete sync review in Source Data Airtable, preserved polling/progress/detail history, collapsed mirror/reset maintenance, and no duplicate Saints surface |
| R3. Site configuration decomposition | Deployed | URL-backed Homepage, About, Directory headers, and Footer subtabs with isolated data loading, forms, save feedback, and authorization |
| R4. Image tooling compaction | Deployed | Tokenized compact editors, synchronized large-editor dialogs, full-size inspection, and keyboard controls for focal/crop adjustment |
| R5. Assignment and access simplification | Deployed | Internal URL-backed workload queue rail, compact assignment creation, summary-first user access cards, consistent sensitive-action terminology, and explicit nested-tab styling |

## Admin refinement phase (complete)

This phase followed the completed nine-chunk overhaul and R1-R5 UX remediation.
All four chunks are deployed; it did not reopen either earlier sequence.

| Chunk | Status | Scope |
| --- | --- | --- |
| A1. Detail workspace tabs | Deployed | URL-backed Saint and Tradition review tabs that render only the active workflow; Saint aliases folded into Overview; Public Fields renamed Key Facts; shallow Instagram and Place detail rails removed |
| A2. Homepage configuration compaction | Deployed | Responsive two-column configuration layout, compact adjacent media placements, and advanced image adjustments reserved for the larger editor |
| A3. Source Data simplification | Deployed | Source-specific Airtable and Instagram history, retired combined overview/history navigation, preserved raw import records |
| A4. Dashboard and workload consolidation | Deployed | Team/My Workflow grouping, My Work embedded in Dashboard, and redundant sidebar destinations removed |

A2 keeps the existing homepage field and save contracts while reducing the
default page length. On wider screens, configuration sections share a two-column
grid, the Featured Traditions workflow spans both columns, and its media
placements form a responsive card grid. Compact banner editors retain direct
drag composition; labeled precision controls remain available in the
synchronized larger editor. Narrow layouts return to one readable column.

A3 removes the redundant Source Data overview and combined Import History
destinations. Source Data opens on Reconciliation, while Airtable and Instagram
each retain their operational job history and expose preserved raw import batch
summaries in their own workspace. Existing Airtable, Instagram, CSV, and manual
batch records remain unchanged in the shared database model.

A4 makes the sidebar Dashboard brand the single landing-page link and removes
the duplicate Dashboard and My Work destinations from Operations. The Dashboard
separates shared editorial counts under Team Workflow from personal assignment
counts under My Workflow, then embeds the full assignment workspace at the
bottom. Existing `/admin/work` links redirect to the embedded URL-backed queue.

## Admin roles and workflow phase (complete)

This five-chunk phase separates team visibility, publication, matching, and
editorial progress while keeping every deployed chunk internally coherent. All
five chunks are deployed as of August 9, 2026.

| Chunk | Status | Scope |
| --- | --- | --- |
| B1. Status and role foundation | Deployed | Additive Team Visibility, Publication Status, and Workflow Status fields; Fact-checker/Writer roles; scoped capability presets; safe legacy-status compatibility and entity backfills |
| B2. Scoped catalog and unified search | Deployed | Role-filtered Full Catalog/Public Saint review, workflow cards and orthogonal filters, one authorization-scoped fuzzy Saint search across admin surfaces |
| B3. Editorial permissions and assignments | Deployed | Structured versus long-form action gates, shared readiness assignment card, self-assignment, assignee workflow updates and admin override |
| B4. Duplicate detection and reconciliation | Deployed | Durable manual full-catalog scan, individual flags, evidence-based candidate queue and duplicate-only Editor reconciliation access |
| B5. Saint merge and hardening | Deployed | Conflict-aware transactional merge, relationship transfer, retired-slug redirects, privacy audit and legacy cleanup notes |

The completed implementation sequence allowed B2 and B3 to proceed independently
after B1. B4 depended on B2's unified matching/search foundation but not on B3;
B5 followed B3 and B4. The Release Captain integrated and deployed every chunk
separately, preserving a production confirmation gate between chunks.

B1 deliberately keeps the current status controls in place so no admin screen
ships with a partially migrated workflow. Publication actions dual-write the
legacy and new fields, and database constraints enforce Published implies
Public. The stored Contributor-to-Fact-checker backfill was intentionally staged
for B2 because production migrations run before application replacement; B1
presented and authorized legacy Contributors as Fact-checkers without exposing
the new enum to the old application during rollout. B2 then deployed the stored
role backfill after the B1 application became production-safe for that value.

B2 makes the catalog scope a server-owned value. Site Admins, Data Admins,
Editors, and Curators default to Full Catalog and may switch to the Public team
queue. Fact-checkers, Writers, Translators, and legacy Contributors are clamped
to Public even if a crafted URL or action requests the full catalog. The same
scope is applied to saint detail routes, relationship pickers, tradition/place
saint counts, dashboard and assignment counts, and assignment mutations, so
private saint names and counts are not serialized to an unauthorized browser.
Instagram navigation, matching filters, claims, references, and actions require
`view_instagram_review` independently of ordinary content editing.

The Public queue uses the established workflow card, filter-chip, status-badge,
and responsive review-list patterns. Its four top cards map to Needs Review,
Fact-checked, Populated, and Polished; Publication and authorized Match filters
remain orthogonal. Full-catalog users get connected, URL-backed Full Catalog and
Public tabs. Search uses one weighted name/alias/transliteration/place/tradition/
date/status ranking path with authorization-scoped PostgreSQL candidate
selection. Published saints cannot be marked Private in either the UI or the
server action. B2 also completes the rolling-safe stored Contributor-to-
Fact-checker migration after the B1 application became production-safe for the
new enum value.

B3 applies the structured/long-form split to both visible editing controls and
their server actions. Fact-checkers and legacy Contributors can update summary,
relationship, reference, and media metadata; Writers can also update biographies
and other long-form Markdown. Publication-state changes remain limited to Site
Admins, Data Admins, and Editors. Saint, Tradition, and Place Publish Readiness
surfaces share one compact assignment and workflow section beside the readiness
summary. Any internal role can assign a visible record to themselves. An active
assignee may then move that record through Needs Review, Fact-checked, Populated,
and Polished; assignment managers can override workflow status without first
claiming the record. Assignment lifecycle and workflow status remain independent,
and neither operation publishes content.

B4 stores every proposed Saint pair in the existing private
`DuplicateCandidate` model. An authorized catalog coordinator may run a manual
full-catalog scan from Reconciliation; it reuses the normalized name,
honorific-removal, and transliteration forms from unified Saint search, then
adds overlapping dates, shared places, and shared traditions as explicit
evidence. Existing reviewed candidates are refreshed but never silently
reopened, and imported/manual evidence is not overwritten by a later scan.
Individual Saint Publish Readiness also offers a unified full-catalog search for
manually flagging a pair. Reconciliation presents the two records side by side
and records Confirm duplicate, Not duplicate, Defer, and Reopen decisions.
Confirmation makes the pair eligible for the dedicated B5 merge review; it does
not itself merge, delete, publish, or otherwise mutate either Saint. Site Admins,
Data Admins, and Editors receive this duplicate workflow. Editor access is
restricted to the duplicate queue; generic source conflicts remain limited to
Site and Data Admins.

B5 turns a confirmed candidate into a dedicated merge review rather than adding
destructive controls to the queue card. Authorized catalog coordinators can
compare the proposed survivor, resolve every differing scalar field, and review
relationship counts. Final execution additionally requires Site Admin authority,
the shared sensitive-action password, and an explicit acknowledgement. The
merge runs in one serializable transaction: aliases, biographies, images,
places, traditions, lineage, relationships and their evidence, family and
Museum assignments, Instagram matches and claims, homepage references, source
records, assignments, reconciliation records, and feedback links are moved or
deduplicated before the retired Saint is deleted. Stale drafts, edit conflicts,
and presence rows for both records are cleared so they cannot overwrite the
merged result. A durable `SaintSlugRedirect` preserves every retired public and
admin URL, while the audit event records the selected field sources and transfer
counts. Redirect lookup exposes a destination only when the surviving Saint is
published. See `docs/admin-saint-merge-audit.md` for the relationship, privacy,
and legacy-compatibility audit.

## Capability contract

All access must be enforced server-side. Navigation visibility is a convenience,
not an authorization boundary.

| Capability | Roles by default |
| --- | --- |
| `view_content` | Site Admin, Data Admin, Editor, Fact-checker, Writer, Translator, legacy Contributor |
| `edit_content` | Site Admin, Data Admin, Editor, Fact-checker, Writer, legacy Contributor |
| `publish_content` | Site Admin, Data Admin, Editor |
| `view_source_data` / `run_imports` / `resolve_reconciliation` | Site Admin, Data Admin |
| `access_museum` / `manage_museum` | Site Admin, Curator |
| `manage_site` / `view_analytics` / `manage_users` | Site Admin |
| `manage_assignments` | Site Admin, Data Admin, Editor |
| `manage_sensitive_actions` | Site Admin |
| `view_full_saint_catalog` | Site Admin, Data Admin, Editor, Curator |
| `view_instagram_review` | Site Admin, Data Admin, Editor |
| `edit_structured_content` | Site Admin, Data Admin, Editor, Fact-checker, Writer, legacy Contributor |
| `edit_long_form_content` | Site Admin, Data Admin, Editor, Writer |
| `manage_team_visibility` | Site Admin, Data Admin, Editor |
| `manage_saint_team_visibility` | Site Admin, Data Admin, Editor, Curator |
| `resolve_duplicate_saints` / `merge_saints` | Site Admin, Data Admin, Editor |
| `self_assign_content` / `update_assigned_workflow` | All internal roles, limited to visible or assigned content by the action contract |

All publication-state changes, including returning published content to review,
require `publish_content`. Structured editing requires `edit_structured_content`;
biography and other long-form editing requires `edit_long_form_content`. Bulk deletion, merging,
credential changes, final removal, and similarly destructive operations require
`manage_sensitive_actions`. Museum mutations require `manage_museum`; destructive
Museum mutations additionally require `manage_sensitive_actions`.

## Chunk workflow

For each chunk:

1. Start from current `main` in a short-lived `codex/...` branch/worktree.
2. Read this document and the relevant design/security documentation.
3. Implement one coherent, independently deployable slice. Preserve unrelated work.
   Reuse shared review components and tokens, then inspect every affected screen
   for hierarchy, density, responsive behavior, focus order, and empty, error,
   loading, and success states before committing.
4. Run `npm run dev:check`. Use `npm run codex:verify` only when required by
   the project verification rules or the changed surface.
5. Update this document: mark the chunk status, record what shipped, and identify
   the exact next chunk and any release dependency.
6. Commit the feature. Run `npm run prepare:deployment`, complete and commit the
   branch-specific file in `docs/release-handoffs/`, and push the branch.
7. Notify the active Release Captain with branch, SHAs, summary, verification,
   migrations, environment changes, shared areas, and deploy notes.
8. Ask the Release Captain to message the originating admin-overhaul task after
   production deployment completes. Pause further overhaul work until that notice
   arrives, then refresh from `main` and begin the next chunk.

## Delivered acceptance criteria

### Users & Access

- Site Admin can create an approved user by email and assign one or more roles.
- Site Admin can activate/deactivate users and inspect last sign-in and access changes.
- Nobody can demote/deactivate themselves as Site Admin or remove the last active
  Site Admin. All access changes are audited.
- The sensitive-action credential lives under Users & Access with clear naming,
  audit metadata, and suitable reauthentication/confirmation behavior.
- Form errors render in the workflow instead of becoming opaque action failures.

### Source Data and reconciliation

- Airtable, Instagram, CSV, and manual import runs remain in the shared history
  model. Airtable and Instagram operational history appears in the matching
  source workspace; there is no separate combined-history destination.
- Unresolved conflicts appear in a unified queue with source/type/status filters.
- Reviewers compare preserved raw values to current reviewed values and explicitly
  choose keep-current, accept-source, merge, ignore, or defer where applicable.
- Reingestion never silently overwrites human CMS edits.

### Assignments and dashboards

- An assignment records content type/id, task type, assignee, assigning user,
  state, priority, due date, notes, and created/completed timestamps.
- Supported states are assigned, in progress, blocked, completed, and cancelled.
- Users may self-assign available work; authorized users may assign/reassign others.
- From Saint, Tradition, and Place Publish Readiness, self-assignment first
  claims an available assignment or creates a review assignment when none exists.
- An active assignee may update editorial workflow status. Assignment managers
  may override it. These updates do not complete an assignment or publish content.
- Multiple collaborators are supported. Publication completion rules are explicit.
- Dashboard counters are grouped into Team Workflow and My Workflow. The
  embedded assignment workspace contains My Work, Available Work, Blocked,
  Recently Completed, and Team Workload where authorized.

### Conflict protection and presence

- Every editable object carries a version or last-updated precondition through save.
- Stale saves are rejected without overwriting and show a readable current-versus-
  attempted comparison with reload/reapply choices.
- Presence shows active viewers/editors, expires automatically, and is advisory;
  optimistic concurrency remains the data-safety boundary.

### Final review UX

- Shallow Instagram and Place detail pages keep the primary decision workflow
  visible and do not show a redundant section rail.
- Saint and Tradition detail pages use URL-backed tabs for coherent workflows;
  Publish Readiness owns the primary decision and tab changes warn before
  abandoning dirty edits.
- Errors appear beside fields and in a compact card/tab summary.
- Default images stay compact, with an accessible full-size inspection action.
- Keyboard, focus, horizontal overflow, and common laptop-width behavior are verified.

## Completion record

The nine-chunk admin overhaul, R1-R5 UX remediation, A1-A4 admin refinement, and
B1-B5 roles/workflow phase are complete and deployed. Translation workflow
design and authoring remain explicitly deferred.

### Admin roles and workflow phase (B1-B5)

The five-chunk roles/workflow phase completed production deployment on August 9,
2026. Its final production state is:

- Final `main`: `9335f57`
- Final `deploy`: `c4a6115`
- Final production workflow: `31321311391`
- Integrated verification: `npm run dev:check`, `npm test` (129/129),
  `git diff --check`, and `npm run codex:verify` completed end to end with all
  16 static pages and trace collection; only the existing Autoprefixer warnings
  remained.
- Environment changes or manual release steps: none.

Release ledger:

| Chunk | Final `main` | Final `deploy` | Production workflow | Migration |
| --- | --- | --- | --- | --- |
| B1 | `d93d8d9` | `d830847` | `31314712073` | `20260809100000_admin_workflow_foundation_schema`; `20260809101000_admin_workflow_foundation_backfill` |
| B2 | `25ba198` | `19dbc21` | `31316326596` | `20260810100000_backfill_fact_checker_roles` |
| B3 | `6ad0747` | `4c6d74b` | `31317307383` | None |
| B4 | `de92b54` | `ee067b1` | `31318989970` | None |
| B5 | `9335f57` | `c4a6115` | `31321311391` | `20260811100000_saint_slug_redirects` |

The deployed result keeps full-catalog and duplicate tooling inside the smaller
authorized admin circle; separates team visibility, publication, match, and
workflow state; splits Fact-checker and Writer permissions; adds shared
assignment/workflow controls; and provides evidence-based duplicate detection
plus a transactional, audited, redirect-preserving Saint merge. The detailed B5
relationship and privacy contract remains in `docs/admin-saint-merge-audit.md`.

### Admin UX remediation (R1-R5)

The documented admin UX remediation is complete and deployed as of August 7,
2026.

R5 assignment/access simplification and the final navigation correction are
deployed. Release commits and final release state:

- Admin release commit on `main`: `474031b` (`Align admin nested tab navigation`)
- Final `main`: `bb5be24149c86f51d6ca442b8681928b39c60886`
- Final `deploy`: `6b10e47ec9130012a81b213b8aa0437a74d7da32`
- Production workflow: `31171724513`

The current UI uses the Dashboard sidebar brand as the single landing-page
link, embeds My Work in the Dashboard, and keeps Inbox, Site, Analytics, Users
& Access, Source Data, Airtable, import tools, and content destinations in the
grouped left sidebar. Horizontal navigation is reserved for nested workflows:
Site configuration routes, embedded Work queues, and detail-page section jump
navigation. These nested controls use the shared explicit tab-strip treatment
with outlined inactive tabs, a selected surface, an accent edge, and a connected
accent rule. Detail section jumps retain `aria-current="location"`; route tabs
use `aria-current="page"`.

R5 also condensed assignment creation, made per-user access editing
summary-first, and standardized the user-facing term “sensitive-action
password” across Users & Access, Saints, Instagram, Airtable, errors, and
runbooks. Integrated verification passed `npm run dev:check` and the full test
suite (102 tests). `npm run codex:verify` compiled, type-checked, collected page
data, and generated all 15 static pages before the known Windows junction
`EPERM` during standalone trace copying. No migrations, environment changes,
data backfill, or additional release steps were required.

R4 image tooling compaction is deployed. Release commits:

- `main`: `d3682d2` (`Compact admin image tooling`)
- `deploy`: `c00c642571d47540e2bb7ed40b326ae7d1dd8cdc`
- Production workflow: `31119956735`

The first R4 production run failed while GitHub Actions resolved an action
download because the service returned `Service Unavailable`; the clean retry
succeeded. Integrated verification passed `npm run dev:check` and the full test
suite (100 tests). `npm run codex:verify` compiled, type-checked, collected page
data, and generated all 15 static pages before the known Windows junction
`EPERM` during standalone trace copying.

R3 Site configuration decomposition is deployed. Release commits:

- `main`: `4714be3` (`Decompose site configuration workspace`)
- `deploy`: `9520e56f3f63e1b27700d14d508158b214e3c98c`
- Production workflow: `31117442437`

Verification on the clean integrated R3 release passed `npm run dev:check` and
the full test suite (100 tests). `npm run codex:verify` compiled, type-checked,
collected page data, and generated all 15 static pages before the known Windows
junction `EPERM` during standalone trace copying.

R2 Airtable consolidation is deployed. Release commits:

- `main`: `8ebd208` (`Consolidate Airtable admin workflow`)
- `deploy`: `829ccd2e05051e8006177a3fa4bd6d608d8a3316`
- Production workflow: `31116447493`

Verification on the clean integrated R2 release passed `npm run dev:check` and
the full test suite (100 tests). `npm run codex:verify` compiled, type-checked,
collected page data, and generated all 15 static pages before the known Windows
junction `EPERM` during standalone trace copying.

R1 navigation remediation was initially deployed with release commits:

- `main`: `6d6b392` (`Establish admin workspace navigation`)
- `deploy`: `f9f55701edbd600b485af02cf172f9412f5da17f`
- Production workflow: `31115340382`

Verification on the clean integrated R1 release passed `npm run dev:check` and
the full test suite (100 tests). `npm run codex:verify` compiled, type-checked,
collected page data, and generated all 15 static pages before the known Windows
junction `EPERM` during standalone trace copying.

The site-wide horizontal navigation direction from that initial release was
superseded by the final left-sidebar correction in R5 (`474031b`). Nested Site,
Work, and detail-review navigation retains the horizontal tab treatment.

Chunk 9 production deployment is complete. Release commits:

- `main`: `984da06` (`Complete admin UX accessibility pass`)
- `deploy`: `946e0c6` (`Merge main into deploy`)
- Production workflow: `30986384687`

Verification: `npm run dev:check` and `npm test` passed (84 tests).
`npm run codex:verify` compiled, type-checked, collected page data, and generated
all static pages; only the known Windows junction `EPERM` during standalone
trace copying prevented a zero exit in this worktree.

Rendered browser QA was attempted, but the in-app browser runtime could not
initialize its Windows kernel assets in this worktree. Focus order, ARIA state,
validation linkage, sticky task navigation, and overflow behavior were therefore
verified through implementation review plus the TypeScript and production builds.

Migration: none.

The discussed admin-overhaul scope is complete. Translation workflow design and
authoring remain explicitly deferred and are outside the current overhaul.
