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
  published records, and hidden records.
- `/admin/saints/[id]` supports editing core public saint fields, reviewing
  aliases, places, traditions, dates, Airtable linkage, Instagram tracker
  matches, and imported images, then publishing, returning to review, or hiding
  the saint.

The current review UI is intentionally focused on saint publication. Full
relationship editing, source editing, image approval, biography editing, and
dedicated reconciliation queues remain follow-up workflows.

## Biography workflow

Biographies are written in Markdown, not MDX. Raw HTML and scripts are not allowed. Sources should be attached as structured records instead of being buried only in body text.

## Preview

Preview routes live under `/admin/preview/*`, require authentication, and are noindexed.
