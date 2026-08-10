# Long-form editorial revisions

Long-form public copy uses a three-layer workflow:

1. Browser and server autosave (`AdminEditorialDraft`) protect in-progress form changes.
2. A durable `EditorialRevision` is the private working version that can be saved, submitted, returned, and reviewed.
3. Canonical entity fields, published biographies, and public source links remain the live public version until an editor publishes the revision.

This separation is intentional. Autosave is recovery infrastructure, a revision is an editorial object, and canonical fields remain the public source of truth.

## Covered surfaces

| Admin surface | Revision package | Publication behavior |
| --- | --- | --- |
| Saint Biography | Short description, biography title and Markdown, ordered sources | Archives the previous published biography, creates a new published biography, updates the Saint description, and replaces public Saint source links in one transaction. |
| Tradition Content | Short description, founding-acharya Markdown, history Markdown, key-teachings Markdown, ordered sources | Updates the public Tradition narrative fields and source links in one transaction. |
| Place Public Fields | Public overview Markdown | Updates the public Place overview in one transaction. Internal notes remain outside the revision because they are private operational metadata. |

Existing Saint biography rows marked `draft` or `needs_review` are shown as the starting content when no new-style revision exists. Saving that form converts the work into the revision workflow. The legacy row is preserved until a revision is published, at which point all superseded biography rows are archived.

## Workflow and permissions

- Writers and other users with `edit_long_form_content` can start, save, and submit revisions.
- A submitted revision is read-only to writers.
- Editors and administrators with `publish_content` can publish or return a submitted revision to draft.
- Submitted revisions appear directly on the Dashboard for users with the **Site Admin** or **Editor** role. The queue is not duplicated in the main sidebar.
- Users with long-form editing authority can open a private, noindex page preview from the entity review card; Site Admins and Editors can also open it from the Dashboard queue. The preview reuses the public Saint, Tradition, or Place page template and overlays only the pending revision-owned narrative and source snapshot; it never changes canonical content.
- Publishing is blocked if the relevant live narrative changed after the revision began. Unrelated entity edits do not block publication because the workflow compares the narrative snapshot rather than only the entity version.
- Publishing a revision does not publish an unpublished entity. It only promotes that entity's narrative fields so they are ready when the entity itself is public.

## Source handling

Sources are snapshotted inside the revision rather than edited in place. This prevents a draft citation edit from changing a public source shared by another page.

On publication, unchanged source records are reused. A changed source snapshot creates a new `Source` record, and the entity's ordered `ContentSource` links are replaced atomically with the narrative. Old source records remain available for other links and audit history.

## Page audit and boundaries

The following text remains outside this workflow:

- Names, aliases, dates, relationships, SEO metadata, and other compact structured fields use the existing explicit-save and conflict workflow.
- Internal Place notes are private and save independently.
- Site-wide configuration copy (homepage, About, footer, directory headers) is versioned as site configuration and has different release semantics; it should not be mixed into entity narrative revisions.
- Imported Airtable and Instagram text remains read-only reference material until an editor incorporates it into a revision.

Public queries continue to read canonical entity fields, `published` biography rows, and canonical `ContentSource` links. They never read `AdminEditorialDraft` or an unpublished `EditorialRevision`.
