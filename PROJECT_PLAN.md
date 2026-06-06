# Project plan

This document is the high-level working plan for the Hindu Saints Website MVP. It should stay current enough that a human or agent can open the repository, understand the state of the work, and choose the next useful task without rediscovering the whole project.

## Current status

The project is a Next.js App Router application using TypeScript, PostgreSQL, Prisma, Docker, and a custom admin CMS. Airtable and Instagram are treated as import/reference sources only; the website database is the source of truth.

Implemented foundation:

- Public routes for home, saints index, saint detail pages, sampradaya index, and sampradaya detail pages.
- Protected admin route structure for dashboard, saints, saint detail editing, biographies, sampradayas, Instagram reconciliation, and saint preview.
- Prisma schema covering saints, aliases, sampradayas, places, relationships, media assets, Instagram items, biographies, sources, import batches, external records, reconciliation issues, audit events, and auth models.
- Initial Prisma migration and seed data.
- NextAuth/Prisma auth wiring, role and permission helpers, and protected admin layout.
- Markdown rendering through a shared prose component with sanitization.
- Import and reconciliation scripts for Airtable and Instagram-oriented workflows.
- Docker infrastructure for local PostgreSQL, app runtime, Caddy, and backups.
- Codex Cloud setup and verification path through `npm run codex:verify`.
- Design system docs and token files for centralized styling.

Existing docs:

- `README.md` covers setup, routes, and principles.
- `AGENTS.md` covers project rules and multi-agent commit workflow.
- `docs/data-model.md` covers the database shape and relationship graph direction.
- `docs/content-workflow.md` covers editorial roles, saint workflow, biography workflow, and preview requirements.
- `docs/import-reconciliation.md` covers Airtable and Instagram import rules.
- `docs/design-system.md` and `docs/design/themes.md` cover visual system direction.
- `docs/deployment.md` and `docs/codex-cloud.md` cover local, VPS, and Codex Cloud operations.

Known working-tree note as of this plan: `package-lock.json` and `prisma/migrations/` are untracked locally. Treat them as existing work unless the current task explicitly owns them.

## MVP principles

- Public pages must show only published content.
- Museum and relic fields must never be exposed publicly.
- Missing data should degrade gracefully on public pages and admin pages.
- Saint pages should use shared templates and components.
- Admin workflows should be domain-specific, not a generic third-party CMS.
- Contributors can draft and preview; editors and admins can publish.
- Preview routes must require authentication and be noindexed.
- Raw external import values must be preserved for review and debugging.
- Human CMS edits must not be silently overwritten by later imports.
- Styling should use design tokens and reusable UI components.

## Next steps

### 1. Stabilize the baseline

- Decide whether the current `package-lock.json` and initial Prisma migration should be committed.
- Run local setup from a clean checkout path: install dependencies, start development PostgreSQL, generate Prisma, run migrations, seed, and start the app.
- Run `npm run codex:verify` after dependency setup to confirm the build path.
- Fix any build, type, or lint failures before adding more features.

### 2. Harden authentication and authorization

- Confirm admin routes are fully protected server-side.
- Confirm preview routes require authentication and emit noindex metadata.
- Add or verify role-based permissions for contributor, editor, and admin actions.
- Ensure secrets remain server-only and no auth secrets leak into client code.

### 3. Complete public MVP pages

- Confirm public saint and sampradaya queries filter to `published` status only.
- Improve empty and partial-data states across saint pages, lists, biographies, images, places, aliases, relationships, and sampradayas.
- Keep museum/relic/private import fields out of public components and APIs.
- Add SEO metadata for core public pages.

### 4. Build out admin CMS workflows

- Saints: create, edit, draft, review, publish, archive, and preview.
- Aliases: add, edit, type, source, and review.
- Sampradayas: create, edit, publish, and link saints.
- Biographies: Markdown editing, source attachment, preview, review, and publish.
- Sources: structured source records connected to biographies and relationship claims.
- Instagram items: match to saints, create saint, add alias, ignore, or mark needs review.
- Reconciliation issues: list, inspect raw values, resolve, ignore, and audit decisions.

### 5. Strengthen ingestion and reconciliation

- Preserve raw Airtable, Instagram, CSV, and manual-ingest payloads in `ExternalRecord` or related import records.
- Prefer creating draft records or reconciliation issues over overwriting reviewed CMS fields.
- Add confidence and status handling to import scripts where ambiguity exists.
- Add repeatable import fixtures for testing and demonstrations.

### 6. Improve editorial safety and auditability

- Add server-side validation for all admin mutations.
- Record meaningful `AuditEvent` rows for publish, unpublish, edit, import, reconciliation, and role changes.
- Add clear status transitions for draft, needs review, published, hidden, and archived content.
- Make destructive or irreversible admin actions explicit and limited by role.

### 7. Verification and tests

- Keep `npm run codex:verify` passing.
- Add focused tests or scripted checks around import/reconciliation behavior as those workflows mature.
- Add regression coverage for public-only published filtering.
- Add smoke coverage for admin authorization once the auth flow is stable.

## Method of working

Use this workflow for humans and agents:

1. Start by reading `AGENTS.md`, this plan, and the specific doc related to the task.
2. Inspect the current working tree with `git status --short`.
3. Identify which files the current task owns before editing.
4. Prefer small, vertical tasks that can be verified in one pass.
5. Reuse existing architecture, components, tokens, and helper libraries.
6. Update docs when changing workflow, data model meaning, setup, or operational assumptions.
7. Run the narrowest useful verification command, and run `npm run codex:verify` after dependency setup or before handing off broader changes.
8. Before committing, stage only task-owned files.

For multi-agent safety:

- Do not revert or rewrite unrelated changes.
- Do not use broad `git add .` or `git add -A` unless the task genuinely owns every changed file.
- Use one atomic commit command that unstages, stages intended paths, and commits.
- If Git metadata writes are blocked by sandbox permissions, elevated Git operations are acceptable for normal status, add, commit, branch, log, fetch, pull, push, and remote tasks.
- Do not use destructive Git commands unless explicitly requested.

## Definition of MVP done

The MVP is ready when:

- Public users can browse published saints and sampradayas with graceful partial-data handling.
- Admin users can create, review, preview, and publish saint records and biographies.
- Instagram and Airtable-derived content can be imported or reviewed without overwriting human edits.
- Reconciliation issues can be resolved through the admin interface.
- Auth, role permissions, noindex previews, and server-side validation are in place.
- Build verification passes with `npm run codex:verify`.
- Deployment docs are accurate enough to launch and maintain the site.
