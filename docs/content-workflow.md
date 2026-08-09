# Content workflow

## Roles

- Site Admins manage users, settings, publishing, sensitive actions, and every
  editorial and source-data workflow.
- Data Admins and Editors coordinate the full saint catalog, assignments,
  Instagram matching, duplicate resolution, review, and publishing. Data
  Admins additionally own source-data imports and reconciliation.
- Fact-checkers edit structured summary fields; Writers edit structured and
  long-form fields. Neither role publishes.
- Curators can inspect the full saint catalog and manage Saint team visibility
  alongside Museum work, but cannot use Instagram matching or duplicate tools.
- Translators currently have read-only access to team-Public content until the
  translation model is implemented.
- The legacy Contributor role is treated as Fact-checker during its staged
  removal; new users default to Fact-checker.

## Saint workflow

1. Create or import a saint with Private team visibility, Unpublished
   publication status, and Needs Review workflow status.
2. Add canonical name, display name, slug, short description, location, era, aliases, tradition, image, sources, and Instagram mappings.
3. Preview the page from the admin editor.
4. An authorized catalog coordinator may make the saint Public to the team so
   assigned collaborators can prepare it.
5. Move editorial progress independently through Needs Review, Fact-checked,
   Populated, and Polished.
6. An Editor or Admin publishes it; publishing always makes it Public to the
   team, while unpublishing does not silently change team visibility.

Public saint pages must query only `published` content. Traditions are the
deliberate exception: `draft` and `needs_review` traditions may be publicly
listed and featured using a basic page that exposes only their name, neutral
fallback copy, and associated published saints. Archived traditions remain
private.

Current admin review surfaces:

- `/admin` separates live Team Workflow and My Workflow counts and embeds the
  assignment queues under `#my-work`.
- `/admin/saints` is a role-scoped review workspace. Catalog coordinators get
  connected Full Catalog and Public tabs; other internal roles get only the
  Public team queue without a tab rail. The Public queue begins with four
  workflow cards and keeps Publication, Workflow, and authorized Match filters
  orthogonal. Its unified fuzzy search covers names, aliases, transliterations,
  places, traditions, dates, and workflow labels without widening the user's
  catalog scope.
- Source Data -> Airtable (`/admin/airtable`) hosts the complete Airtable sync
  review. Data Admins should first check mirrored Airtable rows, then
  intentionally import missing draft saints, review or merge obvious draft
  issues, and only then import the cleanup relationship graph.
- `/admin/saints/[id]` supports editing core public saint fields, aliases,
  traditions, places, route order, biographies, sources, dates, Airtable
  linkage, Instagram-derived claims, and imported images, then publishing,
  returning to review, or archiving the saint. Its Publish Readiness panel shows
  active reviewers, supports self-assignment, and lets an active assignee update
  workflow status without granting publication authority.
  Site Admins, Data Admins, and Editors can also flag a possible duplicate from
  Publish Readiness using the same full-catalog search used elsewhere.
- `/admin/instagram` lists real imported Instagram posts/reels/carousels by
  status and is limited to Site Admins, Data Admins, and Editors.
- `/admin/instagram/[id]` supports reviewing a real Instagram item, previewing
  media and caption metadata, attaching an existing saint, creating a new saint
  draft from first-page biodata, inspecting the preserved raw API payload, and
  returning the item to review or ignoring it.
- `/admin/traditions` and `/admin/places` are index pages for finding records;
  individual editors live at `/admin/traditions/[id]` and `/admin/places/[id]`.
  Those detail editors own public overview Markdown, parent/child relationships,
  and duplicate merge workflows so relationship-preserving consolidation happens
  from the canonical record. They share the same readiness assignment and
  assignee-controlled workflow pattern as saint review.
- `/admin/source-data/reconciliation` opens on a private Saint duplicate queue
  for authorized catalog coordinators. The full-catalog scan writes durable,
  evidence-based candidates; reviewers compare both records and confirm,
  dismiss, defer, or reopen a pair. Confirmation does not merge records. Editors
  see only this duplicate queue, while Site and Data Admins may also switch to
  preserved source conflicts.
- A confirmed Saint pair offers a dedicated merge review at
  `/admin/source-data/reconciliation/[candidateId]/merge`. The review chooses
  the canonical record and the source for every differing field before showing
  the complete relationship-transfer summary. Editors and Data Admins may
  inspect this plan, but the final password-protected merge requires Site Admin
  authority. The duplicate is removed only after every transfer succeeds in the
  same transaction. Its former `/saints/[slug]` and admin detail URLs then
  redirect to the surviving record.

## Tradition workflow

Traditions are database records, not live Airtable views. The public tradition
detail page uses the DB-backed public contract in `lib/public-traditions.ts`.
Published traditions receive the reviewed detail layout. Draft and
`needs_review` traditions receive only the basic public page; their unpublished
editorial fields are not part of the public contract.

The admin tradition editor should grow toward this reviewed content set:

- identity and hierarchy: name, slug, alternate names, status, parent tradition,
  and child traditions
- public summary: short description, SEO title, and SEO description
- page sections: founding acharya Markdown, history Markdown, and key teachings
  Markdown
- overview facts: founder/founder saint, origin place, era label, focus label,
  and scriptural basis
- media: reviewed public hero image or emblem, with alt text, credit, source,
  dimensions, and review status
- lineage: ordered saint links for the tree, with optional role labels and
  parent/relationship metadata
- related context: curated related traditions and curated related places with
  display order
- sources and further reading attached as structured records

Until those fields exist, the public page may derive founder, origin, era,
related places, and lineage ordering from associated published saints, but those
derived values are editorial fallbacks rather than the desired source of truth.

Instagram review does not publish content directly. A reviewed Instagram item is
resolved by creating or confirming an `InstagramItemSaint` match. Public
visibility is controlled by the saint: once the saint is `published`, every
matched or published Instagram item attached to that saint is available on the
saint page. Multiple Instagram posts can be attached to the same saint.

The saint review UI is intentionally compact. Traditions and places sit in flat
subsections within Public Fields and use a shared relationship picker: clicking
a search result adds it immediately to the unsaved selection, with no checkbox
list or summary card. Selected rows own removal and relationship-specific
metadata; traditions expose an explicit primary action, while places form a
focused route editor where editors can drag them into reviewed order and set
public roles/labels. If a search has no exact saved match, its create result
opens a minimal inline form seeded from the search. New drafts are attached on
creation and can be refined in their dedicated review screens afterward.

Dedicated reconciliation queues remain a follow-up workflow.

Airtable import job history should remain actionable. When a job reports
collisions, cleanup graph issues, self-skipped relationship rows, or failures,
the job card should expose an expansion with the affected Airtable names/record
IDs, short reasons, and links to CMS saint detail pages where a linked saint
exists.
Editors should not need a deploy log or one-off script output to identify which
records need review.

## Biography workflow

Biographies are edited from the saint review screen, not from a separate
biography queue. The editor stores reviewed biography content in `Biography`
records and uses the shared admin Markdown editor so the same authoring controls
can be reused for place and tradition text fields.

Biographies are written in Markdown, not MDX. Raw HTML and scripts are not
allowed. Sources should be attached as structured records instead of being
buried only in body text.

Imported Airtable biography text is reference material for admins. It should be
shown near the biography editor as read-only context, but it is not a public
biography fallback and should not overwrite reviewed `Biography` content.

## Preview

Preview routes live under `/admin/preview/*`, require authentication, and are noindexed.
