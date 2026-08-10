# Durable editorial drafts

Saint, Tradition, and Place detail editors preserve interim changes in a shared
`AdminEditorialDraft` record. Drafts are scoped to an entity and editor section,
carry the live record version they were based on, and increment their own
revision with every autosave.

The live content row is not changed by autosave. Public pages therefore continue
to read the last explicitly saved or published values. Explicit section saves
check and increment the live version, apply the section mutation, and delete the
matching interim draft in one transaction.

The browser also keeps the latest form payload in local storage. This is a
fallback for network loss, session expiry, or a route error; the server draft is
the normal recovery source. Local recovery data is removed after a successful
explicit save or an intentional discard.

## Conflict behavior

- A draft revision mismatch means another editor autosaved first. The local copy
  is retained, but it is not allowed to overwrite the shared draft silently.
- A live-version mismatch means another section or editor changed the live
  entity. The editor may discard the interim draft or deliberately rebase its
  current values onto the newly rendered live version.
- Explicit saves use the same live-version precondition and redirect to the
  existing current-versus-attempted conflict workflow when stale.

## Covered sections

- Saints: overview, public fields, biography, and aliases.
- Traditions: overview, public fields, and long-form sections.
- Places: overview/hierarchy and public fields.

Relationship, media, import, and destructive workflows retain explicit saves;
they are not interim prose/content drafts.

## Autosave versus editorial review

Autosave drafts are recovery copies, not publishable editorial revisions. Long-form
public copy has a separate durable review layer that preserves the current public
text while replacement copy is developed. See
[`editorial-revision-workflow.md`](./editorial-revision-workflow.md) for the
covered fields, source behavior, and publish transitions.
