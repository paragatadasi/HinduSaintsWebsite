# Content workflow

## Roles

- Admins manage users, imports, settings, and publishing.
- Editors review, resolve reconciliation issues, and publish.
- Contributors create drafts, edit assigned content, preview, and submit for review.

## Saint workflow

1. Create or import a saint as `draft`.
2. Add canonical name, display name, slug, short description, location, era, aliases, tradition, image, sources, and Instagram mappings.
3. Preview the page from the admin editor.
4. Submit as `needs_review`.
5. Editor reviews and publishes.

Public pages must query only `published` content.

Current admin review surfaces:

- `/admin` shows live workflow counts.
- `/admin/saints` lists saints by status so editors can find imported records,
  published records, and archived records.
- `/admin/saints` also hosts the Airtable sync review panel. Editors should
  first check mirrored Airtable rows, then intentionally import missing draft
  saints, then review or merge obvious draft issues before importing guru
  relationships.
- `/admin/saints/[id]` supports editing core public saint fields, aliases,
  traditions, places, route order, biographies, sources, dates, Airtable
  linkage, Instagram-derived claims, and imported images, then publishing,
  returning to review, or archiving the saint.
- `/admin/instagram` lists real imported Instagram posts/reels/carousels by
  status.
- `/admin/instagram/[id]` supports reviewing a real Instagram item, previewing
  media and caption metadata, attaching an existing saint, creating a new saint
  draft from first-page biodata, inspecting the preserved raw API payload, and
  returning the item to review or ignoring it.
- `/admin/traditions` and `/admin/places` are index pages for finding records;
  individual editors live at `/admin/traditions/[id]` and `/admin/places/[id]`.
  Those detail editors own public overview Markdown, parent/child relationships,
  and duplicate merge workflows so relationship-preserving consolidation happens
  from the canonical record.

## Tradition workflow

Traditions are published records, not live Airtable views. The public tradition
detail page uses the DB-backed public contract in `lib/public-traditions.ts` and
must render gracefully while editorial fields are incomplete.

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

The saint review UI is intentionally compact. Traditions and places use a
shared searchable multi-select dropdown so the starting view does not expose
large checkbox lists. Selected places then appear in a focused route editor,
where editors can drag them into reviewed route order and set public place
roles/labels.

Dedicated reconciliation queues remain a follow-up workflow.

Airtable import job history should remain actionable. When a job reports
collisions, unresolved guru relationships, self-skipped rows, or failures, the
job card should expose an expansion with the affected Airtable names/record IDs,
short reasons, and links to CMS saint detail pages where a linked saint exists.
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
