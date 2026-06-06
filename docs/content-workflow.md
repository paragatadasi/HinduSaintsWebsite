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

## Biography workflow

Biographies are written in Markdown, not MDX. Raw HTML and scripts are not allowed. Sources should be attached as structured records instead of being buried only in body text.

## Preview

Preview routes live under `/admin/preview/*`, require authentication, and are noindexed.
