# Detail-page review model

[Design system index](../design-system.md)


Start with item/detail pages, then apply the lessons to bulk/list pages. Detail
pages should have one primary decision card at first. Additional cards can be
expanded by the user and should stay expanded/collapsed for the rest of that
browser session.

Default anatomy:

- Review header: page title, status chips, source links, and one primary page
  action when available.
- Primary decision card: open by default and focused on the main resolution
  task for shallow detail pages. On Saint and Tradition detail pages it belongs
  to the default Publish Readiness tab.
- Assignment and workflow sections place the current reviewer's Task status
  beside Editorial progress. The status control applies to the reviewer's own
  active assignment; editorial progress remains the content-level workflow.
- Summary-first editable cards: show current values as readable facts, then use
  an Edit action to switch into a per-card form.
- Keep summary and edit modes spatially consistent. When a card switches from
  readable facts to editable controls, preserve the same field order and grid
  positions wherever the field set allows it, so reviewers do not have to
  remap the content before making edits.
- Put comparison workflows and relationship editors near the data they affect.
  For example, Instagram-derived saint claims belong beside public fields, and
  parent/child tradition or place hierarchy belongs in the overview/relationship
  area instead of an isolated technical card.
- Short-field cards: compact editing for structured fields.
- Long-form cards: Markdown, imported text, biographies, notes, captions, and
  other large text areas in separate cards.
- Secondary collapsible cards: raw imports, technical snapshots, source JSON,
  advanced SEO, historical logs, and other reference material.

Keep explicit per-card actions such as `Save biodata`, `Save overview`, or
`Save lineage`. Core Saint, Tradition, and Place content cards also autosave an
interim editorial draft without changing the live/public record. Use the shared
editorial draft form for its `Saving`, `Saved`, browser recovery, retry, discard,
and conflict/rebase states; do not invent page-specific autosave behavior.

Long-form public narratives add a durable editorial-revision layer after
autosave. Their review UI shows the live public version separately from the
working version, labels whether the working version is a draft or submitted for
review, and keeps publication actions with the submitted version. Associated
public citations belong to the same revision package so prose and evidence are
approved together. See `docs/editorial-revision-workflow.md`.

Pending narrative previews use the same shared public Saint, Tradition, and
Place page components as live routes. Show them inside the shared private
preview frame with revision/noindex context and a route back to review; do not
build simplified page-specific preview approximations or read drafts from a
public route.

Repeatable data should start small. For lists such as lineage saints, aliases,
sources, related links, localities, or related places, show existing reviewed
rows and use an `Add more` action or searchable multi-select instead of
rendering a fixed set of empty fields.

Large option sets should use `SearchableSelect` or `SearchableMultiSelect`
rather than native selects.

Relationship and taxonomy controls should respect the data semantics:

- Use `SearchableSelect` for single relationships such as parent state, founder
  saint, origin place, source, or parent tradition.
- Use `SearchableRelationshipPicker` for many-to-many review relationships such
  as saint traditions and saint places, where selected rows also own primary,
  route, or removal controls. Keep `SearchableMultiSelect` for checkbox-based
  child selection such as state localities.
- Do not show impossible relationship controls. A state place should not show a
  parent-state picker while it is being edited as a state.
- For controlled vocabularies that can grow editorially, use search/select
  behavior that reuses saved values while allowing a new value when needed. The
  place country field is the model for this pattern.
- Keep relationship fields connected to the real database relationships. For
  example, child traditions come from `parentTraditionId`, and state localities
  come from locality records whose `parentStateId` points to the state.

