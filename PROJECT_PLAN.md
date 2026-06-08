# Project plan

This document is the high-level working plan for the Hindu Saints Website MVP. It should stay current enough that a human or agent can open the repository, understand the state of the work, and choose the next useful task without rediscovering the whole project.

## Current status

The project is a Next.js App Router application using TypeScript, PostgreSQL, Prisma, Docker, and a custom admin CMS. Airtable and Instagram are treated as import/reference sources only; the website database is the source of truth.

Implemented foundation:

- Public routes for home, saints index, saint detail pages, tradition index, and tradition detail pages.
- Protected admin route structure for dashboard, saints, saint detail editing, biographies, traditions, Instagram reconciliation, and saint preview.
- Prisma schema covering saints, aliases, traditions, places, relationships, media assets, Instagram items, biographies, sources, import batches, external records, reconciliation issues, audit events, and auth models.
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

## Work tracks

The MVP should move on three parallel tracks: frontend experience, backend/data integrity, and data integration. The tracks should meet at explicit contracts, not by having every page depend directly on raw Prisma records or raw external source payloads from day one.

### Frontend track

Goal: build the public website and admin CMS experience against stable typed contracts and realistic seed data.

This track owns:

- Public page layout, navigation, saint templates, tradition templates, biography rendering, empty states, and SEO presentation.
- Site-level editorial copy such as homepage hero text, about page content, footer copy, and other non-entity pages.
- Image presentation for saint portraits, tradition imagery, homepage/site imagery, galleries, and special feature pages.
- Admin workflows for dashboards, saint editing, aliases, biographies, traditions, Instagram review, reconciliation, preview, and publishing affordances.
- Shared design system components and tokens.
- Fixture and seed scenarios that represent real editorial complexity: missing dates, multiple aliases, multiple traditions, unpublished biographies, unresolved Instagram matches, conflicts, and partial source data.
- Public source and further-reading presentation for saints, traditions, biographies, and relationships.

Frontend work can proceed before every backend mutation is complete when the contract is clear. In that case, use typed fixtures or seed data that match the contract and keep the eventual data loader boundary small.

### Backend track

Goal: make persistence, permissions, imports, reconciliation, auditability, and deployment reliable.

This track owns:

- Prisma schema, migrations, seed data, and database access helpers.
- Auth, roles, route protection, server-side validation, and publish permissions.
- Data loaders that map database records into the frontend contracts.
- Server actions or route handlers for CMS mutations.
- Site content persistence for homepage modules, about page content, footer text, and other editable public copy.
- Media asset persistence, storage abstraction, responsive image metadata, and image usage relationships.
- Source and further-reading relationships between canonical source records and content entities.
- Import pipelines for Airtable, Instagram, CSV, and manual ingest.
- Reconciliation issue creation, resolution, and audit events.
- Verification, Docker/Postgres setup, backups, and deployment safety.

Backend work should preserve the frontend contracts unless the contract itself is intentionally revised.

### Data integration track

Goal: bring Airtable, Instagram, CSV, and other editorial source data into the website review flow without making those sources the live website source of truth.

This track owns:

- Airtable export/import mapping, raw payload preservation, and source record traceability.
- Instagram export/scrape ingestion, shortcode/URL normalization, caption preservation, thumbnail references, and saint-name extraction.
- CSV/manual ingest patterns for editorial batches that do not originate in Airtable or Instagram.
- Normalization of names, aliases, dates, places, traditions, captions, URLs, and source references.
- Candidate creation for saints, aliases, biographies, sources, relationships, media, and Instagram mappings.
- Attachment and image import handling from Airtable, Instagram thumbnails, CSV/manual references, and editorial uploads.
- Source deduplication and candidate matching across Airtable, Instagram captions, CSV rows, and manual editorial references.
- Reconciliation issue creation when source data conflicts with reviewed CMS data.
- Import batch reporting, confidence scoring, dry-run behavior, and repeatable fixtures.

Data integration work should write to raw external records, candidate records, draft records, or reconciliation issues. It must not silently overwrite reviewed CMS content.

## Contracts and seams

These are the main seams where frontend and backend can work independently.

### 1. Public saint contract

Purpose: everything needed to render saint cards and saint detail pages without exposing private fields.

Needs to include:

- stable identity: `id` when needed internally, `slug` publicly
- display fields: display name, canonical name, short description, era label, location summary
- publication state: public loaders return only published saints
- imagery: primary portrait/hero image, alt text, caption, credit, source/license, focal point, optional gallery
- taxonomy: tradition summaries, aliases, places
- biography: published biography summary and published biography body Markdown
- relationships: curated public relationships, with source/certainty display where available
- sources and further reading: curated public source summaries, grouped by use when helpful
- Instagram/media links that are approved for public display
- SEO title and description

Current seam: `lib/sample-data.ts` provides early `SaintSummary` fixtures used by public pages and some admin shells. This should evolve into shared contract types plus database-backed loaders.

### 2. Public tradition contract

Purpose: render tradition index/detail pages and connect saints to traditions.

Needs to include:

- slug, name, alternate names, short description, and optional long introduction Markdown
- founder or founder saint summary when available
- parent/child tradition summaries when available
- published saint summaries associated with the tradition
- imagery: primary image, hero image, emblem/icon, gallery, credits, and source/license where available
- sources and further reading for the tradition, lineage, or organization
- SEO title and description
- public status filtering

### 3. Site content contract

Purpose: support editable public copy that is not owned by a specific saint or tradition, such as the homepage banner, about page, footer copy, and future landing-page sections.

Needs to include:

- stable key or slug for each content block or page
- content type: homepage hero, about page, footer, announcement, navigation label, special feature page, or reusable page section
- display fields such as eyebrow, title, body Markdown, call-to-action labels/URLs, and section ordering
- media references for hero images, section images, background images, feature thumbnails, and decorative-but-managed imagery
- public template copy such as saints/traditions index intros, homepage section headings, detail-page section labels, and reusable Instagram/source section labels
- publication status: draft, needs review, published, hidden, archived
- preview support under protected admin routes
- SEO title and description for full pages
- audit trail and role-sensitive actions for publishing changes

Current seam: `lib/site-content.ts` provides typed fixture content for the homepage hero and about page. This should evolve into CMS-managed site content records and database-backed loaders.

### 4. Media asset and image usage contract

Purpose: manage images once and attach them safely to saints, traditions, site pages, special features, biographies, Instagram items, and other public or admin surfaces.

Needs to include:

- canonical media asset fields: URL, storage key, alt text, caption, credit, source URL, width, height, MIME type, created timestamp
- provenance and rights fields: source type, uploader/import batch, license or usage notes, original filename, external asset ID when available
- image usage relationships: primary portrait, hero image, card thumbnail, gallery item, inline biography image, tradition emblem, homepage/site image, special-feature hero, source illustration, Instagram thumbnail
- per-usage display metadata: alt override, caption override, crop/focal point, sort order, public/private visibility, status, and editorial notes
- responsive image metadata: original dimensions, generated variants, preferred aspect ratio, blur/placeholder data when available
- public contract shape that exposes only approved media URLs, dimensions, alt text, captions, and credits
- admin contract shape that exposes source/provenance, unresolved candidates, private notes, and usage warnings
- storage abstraction so loaders return public URLs while the backend can use local uploads, object storage, or another storage provider later

Recommended data model direction:

- Keep `MediaAsset` as the canonical asset record.
- Use per-entity join models or a generalized media-usage join when images need roles, sort order, visibility, and per-context captions.
- Do not overload a single asset URL field for all uses; distinguish image identity from how/where it is used.
- Treat Instagram thumbnails and Airtable attachments as imported media candidates until reviewed.
- Keep private museum/relic images out of public contracts even when preserved in raw import records.
- Store enough credit/source/license metadata to render public attribution and support editorial review.

### 5. Admin saint editing contract

Purpose: support saint creation, editing, preview, review, and publish decisions.

Needs to include:

- all editable public fields
- status fields: draft, needs review, published, hidden, archived
- required-field completeness indicators
- aliases with alias type and source
- tradition links and primary tradition selection
- places and place types
- image selection, upload references, primary image choice, gallery order, captions, credits, and visibility
- source and further-reading links connected to the saint as a whole
- internal notes and audit history where appropriate
- role-sensitive actions: save draft, submit for review, publish, hide, archive

The frontend can first build this as a form against seeded/editable fixtures. The backend then supplies loaders and mutations with validation and permission checks.

### 6. Biography and Markdown contract

Purpose: let contributors draft biographies while public pages render only reviewed content.

Needs to include:

- biography title, slug, body Markdown, status, author/editor metadata
- published and preview rendering modes
- source attachment references
- inline or associated images when approved for biography display
- distinction between sources cited by the biography and further reading shown for the saint
- sanitized Markdown rendering rules
- review timestamps and publication timestamps

The rendering component should not care whether Markdown comes from fixtures or Prisma.

### 7. Source, citation, and further-reading contract

Purpose: keep source-backed content structured instead of burying citations only in prose, while also supporting curated further reading for each saint and tradition.

Needs to include:

- canonical source fields: title, author, publisher, publication year, URL, source type, and notes
- source identity and deduplication fields when available: ISBN, archive URL, website domain, external source ID, or normalized citation key
- connection from sources to saints, traditions, biographies, relationships, places, media, and other content records
- connection intent: citation, further reading, primary source, biography source, lineage source, image credit, external profile, or internal reference
- display metadata on each connection: label, excerpt/page reference, note, sort order, and public/private visibility
- editorial status on each connection where needed: draft, needs review, published, hidden
- public contract shape that exposes only approved source summaries and approved notes
- admin contract shape that exposes internal notes, raw import references, unresolved source candidates, and duplicate warnings

Recommended data model direction:

- Keep `Source` as the canonical bibliographic/web/source record.
- Use a join model such as `ContentSource` to attach a source to many entity types.
- Treat "further reading" as a type or intent on the join, not as a separate duplicate source record.
- Store page numbers, chapter references, short editorial notes, public/private visibility, and display order on the join because those vary per saint, tradition, biography, or relationship.
- Preserve imported citation strings in raw external records even after they are matched to canonical `Source` records.
- Create reconciliation issues when an imported source conflicts with an existing reviewed source connection.

### 8. Instagram review contract

Purpose: turn Instagram imports into editorial decisions.

Needs to include:

- imported item URL, shortcode, type, caption, posted date, thumbnail, extracted names, and raw import reference
- thumbnail/media reference as an imported media candidate, not automatically a public saint image
- suggested saint matches with confidence
- current status: imported, suggested, needs review, matched, ignored, published, hidden
- editor actions: match saint, create saint draft, add alias, ignore, mark needs review
- preservation of raw values and reviewed decisions

Frontend can iterate on the queue and decision UI with seed data while backend match logic improves.

### 9. Airtable import contract

Purpose: preserve Airtable as an import/reference source while migrating useful editorial data into the website review flow.

Needs to include:

- import batch identity, source name, import timestamp, status, and summary
- Airtable table name, record ID, field names, raw values, and raw payload JSON
- mapping from Airtable fields to candidate website fields
- private handling for museum/relic fields so they never reach public contracts
- source handling: preserve raw citation/further-reading strings, match to existing sources when confident, and create source candidates when uncertain
- image handling: preserve raw attachment metadata/URLs, create media candidates, and never expose private museum/relic attachments publicly
- candidate actions: create draft saint, update draft field, create alias, create source, attach further reading, attach citation, attach image candidate, create relationship candidate, ignore field
- conflict behavior that creates reconciliation issues instead of overwriting reviewed CMS edits
- dry-run/report mode for reviewing what an import would change

This contract belongs to the data integration track, then hands reviewed candidates to backend/CMS workflows.

### 10. External record and import batch contract

Purpose: make every external value traceable, debuggable, and replayable.

Needs to include:

- source type: Airtable, Instagram, CSV, or manual
- external ID or stable source key
- entity type and optional linked website entity ID
- raw payload JSON, imported timestamp, last-seen timestamp, and batch reference
- raw source/citation strings before normalization or matching
- raw attachment/image metadata before storage, review, or media matching
- import status, row/item counts, error counts, and notes
- enough metadata to answer "where did this value come from?"

This is the shared integration/backend seam for all imports.

### 11. Reconciliation issue contract

Purpose: surface conflicts between external imports and reviewed website content.

Needs to include:

- issue type, severity, entity type, entity ID, message
- raw external value, suggested value, current reviewed value when available
- media-specific conflicts such as different image credit, source URL, alt text, rights notes, or primary image choice
- source/import batch reference
- status: open, resolved, ignored
- resolution actor, resolution timestamp, and resolution notes

This is the main safety seam for "do not silently overwrite human edits."

### 12. Auth and permission contract

Purpose: keep protected CMS behavior independent from individual page implementation.

Needs to include:

- user identity, email, and role
- route-level protection for all `/admin/*` routes
- action-level permissions for contributor/editor/admin behavior
- noindex metadata for previews and admin pages
- server-side enforcement for publish, user management, destructive actions, and imports

### 13. Audit contract

Purpose: make editorial and import changes explainable.

Needs to include:

- actor, action, entity type, entity ID, before snapshot, after snapshot, timestamp
- events for publish/unpublish, important edits, imports, reconciliation decisions, and role changes
- admin-facing history views where useful

## Default work order

When no specific task is assigned, choose the next task by track:

- Frontend default: define or refine the relevant contract type, add realistic seed/fixture states, and build the page or workflow against that contract.
- Backend default: protect/admin-auth first, then implement loaders and mutations that satisfy an existing contract.
- Data integration default: define the import mapping and raw preservation contract first, then implement dry-run ingestion before mutating website records.
- Cross-track default: if a page or workflow is blocked on another track, write down the contract and seed data first, then continue the unblocked track.

Near-term frontend candidates:

- Expand saint and tradition contracts beyond current summaries.
- Define a shared public image shape for URL, dimensions, alt text, caption, credit, focal point, and usage role.
- Build richer public saint detail states against fixtures.
- Add fixture image states for saint portraits, tradition images, homepage/site images, and special feature images.
- Add source/further-reading display states for saints and traditions.
- Build admin saint editor UI against seeded draft/review/published records.
- Add admin source attachment UI states: cited source, further reading, unresolved imported source, duplicate warning.
- Build Instagram review queue interactions against fixture data.
- Build reconciliation issue list/detail UI against fixture data.

Near-term backend candidates:

- Protect admin and preview routes server-side.
- Confirm and commit baseline lockfile and migration artifacts when appropriate.
- Add database-backed loaders that return the public saint and tradition contracts.
- Add media loaders that map `MediaAsset` and usage relationships into public image contracts.
- Extend source/content-source modeling if the current fields are not enough for connection intent, visibility, and display metadata.
- Extend media modeling if the current fields are not enough for usage roles, per-context captions, focal points, visibility, and rights metadata.
- Add server-side validation and mutations for saint draft editing.
- Add audit events for publish and reconciliation decisions.

Near-term data integration candidates:

- Define Airtable field mapping for saints, aliases, traditions, biographies, sources, places, and relationships.
- Define Airtable attachment/image mapping for public images, private museum/relic images, credits, source URLs, and rights notes.
- Expand import fixtures to include messy real-world cases: duplicate names, alternate spellings, missing dates, conflicting descriptions, private museum/relic fields, duplicate source citations, vague further-reading strings, multiple source references, duplicate images, missing alt text, and ambiguous image rights.
- Implement or verify dry-run Airtable import reporting before writing draft/candidate records.
- Normalize Instagram item URLs, shortcodes, captions, extracted names, thumbnails, and match confidence.
- Preserve Instagram thumbnails as imported media references until reviewed for public display.
- Normalize and dedupe source references from Airtable, CSV, Instagram captions, and manual batches.
- Ensure each integration path creates `ExternalRecord` and `ImportBatch` traces.
- Ensure conflicts create `ReconciliationIssue` rows instead of overwriting reviewed content.

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

- Public users can browse published saints and traditions with graceful partial-data handling.
- Admin users can create, review, preview, and publish saint records and biographies.
- Instagram and Airtable-derived content can be imported or reviewed without overwriting human edits.
- Reconciliation issues can be resolved through the admin interface.
- Auth, role permissions, noindex previews, and server-side validation are in place.
- Build verification passes with `npm run codex:verify`.
- Deployment docs are accurate enough to launch and maintain the site.
