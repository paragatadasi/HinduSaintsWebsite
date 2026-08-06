# Admin overhaul workflow

This document is the durable source of truth for the admin overhaul. Agents
should read it after conversation compaction and before starting or resuming an
admin-overhaul chunk. Update the status table and next-step notes in the same
branch as every chunk.

## Outcomes and fixed decisions

- Navigation is grouped into Operations, Source Data, and Content, with Museum
  as its own top-level destination because Museum owns an internal subtab system.
- Roles are additive. Named roles are presets over server-enforced capabilities.
- Site Admin has unrestricted access, user management, and destructive actions.
- Data Admin is an Editor plus source-data, import, and reconciliation authority.
- Editor can edit and publish content. Contributor can edit and submit content
  but cannot publish. Curator can fully manage Museum, while destructive Museum
  actions remain Site Admin-only. Translator is view-only until translation
  workflows are designed.
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
| R1. Navigation remediation | Ready for release | Canonical workspace subtabs, compact top-level workspace navigation, active route state, and honest section-jump navigation semantics |
| R2. Airtable consolidation | Pending deployment of R1 | Move the complete Airtable sync review into Source Data and remove the duplicate Saints surface |

## Capability contract

All access must be enforced server-side. Navigation visibility is a convenience,
not an authorization boundary.

| Capability | Roles by default |
| --- | --- |
| `view_content` | Site Admin, Data Admin, Editor, Contributor, Translator |
| `edit_content` | Site Admin, Data Admin, Editor, Contributor |
| `publish_content` | Site Admin, Data Admin, Editor |
| `view_source_data` / `run_imports` / `resolve_reconciliation` | Site Admin, Data Admin |
| `access_museum` / `manage_museum` | Site Admin, Curator |
| `manage_site` / `view_analytics` / `manage_users` | Site Admin |
| `manage_assignments` | Site Admin, Data Admin, Editor |
| `manage_sensitive_actions` | Site Admin |

Publishing and archiving content require `publish_content`. Drafting, editing,
and returning content to review require `edit_content`. Bulk deletion, merging,
credential changes, final removal, and similarly destructive operations require
`manage_sensitive_actions`. Museum mutations require `manage_museum`; destructive
Museum mutations additionally require `manage_sensitive_actions`.

## Chunk workflow

For each chunk:

1. Start from current `main` in a short-lived `codex/...` branch/worktree.
2. Read this document and the relevant design/security documentation.
3. Implement one coherent, independently deployable slice. Preserve unrelated work.
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

## Detailed remaining acceptance criteria

### Users & Access

- Site Admin can create an approved user by email and assign one or more roles.
- Site Admin can activate/deactivate users and inspect last sign-in and access changes.
- Nobody can demote/deactivate themselves as Site Admin or remove the last active
  Site Admin. All access changes are audited.
- The destructive-action credential moves under Users & Access with clear naming,
  audit metadata, and suitable reauthentication/confirmation behavior.
- Form errors render in the workflow instead of becoming opaque action failures.

### Source Data and reconciliation

- Airtable, Instagram, CSV, and manual import runs appear in one history model/view.
- Unresolved conflicts appear in a unified queue with source/type/status filters.
- Reviewers compare preserved raw values to current reviewed values and explicitly
  choose keep-current, accept-source, merge, ignore, or defer where applicable.
- Reingestion never silently overwrites human CMS edits.

### Assignments and dashboards

- An assignment records content type/id, task type, assignee, assigning user,
  state, priority, due date, notes, and created/completed timestamps.
- Supported states are assigned, in progress, blocked, completed, and cancelled.
- Users may self-assign available work; authorized users may assign/reassign others.
- Multiple collaborators are supported. Publication completion rules are explicit.
- Dashboard sections are My Work, Available Work, Blocked, Recently Completed,
  and Team Workload where authorized.

### Conflict protection and presence

- Every editable object carries a version or last-updated precondition through save.
- Stale saves are rejected without overwriting and show a readable current-versus-
  attempted comparison with reload/reapply choices.
- Presence shows active viewers/editors, expires automatically, and is advisory;
  optimistic concurrency remains the data-safety boundary.

### Final review UX

- Primary decision workflow stays visible; secondary/reference material starts collapsed.
- Task tabs do not hide the primary decision and warn before abandoning dirty edits.
- Errors appear beside fields and in a compact card/tab summary.
- Default images stay compact, with an accessible full-size inspection action.
- Keyboard, focus, horizontal overflow, and common laptop-width behavior are verified.

## Resume point

Current chunk: **R1 navigation remediation ready for release**.

After R1 is confirmed in production, begin R2 by moving the complete Airtable
sync review workflow into the Source Data Airtable workspace. Preserve polling,
check mode, progress, rich job summaries, and affected-record detail links; then
remove the duplicate panel and Airtable job query from the Saints queue.

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
