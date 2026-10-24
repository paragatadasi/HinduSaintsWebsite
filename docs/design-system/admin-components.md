# Admin components and rollout

[Design system index](../design-system.md)

Implementation direction:

- Use `ReviewWorkflow` for the primary decision object.
- Use `ReviewSection` for sections inside a workflow.
- Use `ReviewFactGrid` for readable current-value summaries.
- Use `CollapsibleReviewCard` for secondary cards whose open state should
  persist in `sessionStorage` by route and card ID.
- Integrate expand/collapse chevrons into the panel header or disclosure row,
  rather than adding separate Show/Hide buttons. Keep a visible title or accessible
  action label, native keyboard operation, focus indication, and accurate expanded
  state. Prefer native disclosure semantics when they fit the interaction.
- Keep configurable admin image and crop previews within the shared compact
  editor dimensions. Use `AdminImageEditorDialog` for full-size inspection or
  a larger synchronized editor instead of expanding images to the page width.
- Pointer-based focal and crop tools must expose equivalent labeled range or
  keyboard controls. Compact previews may reserve those controls for an
  associated larger editor when its trigger is keyboard accessible and both
  views remain synchronized; pointer gestures must never be the only available
  way to position an image.
- Use `ReviewEditToggle` when a card should start in summary mode and reveal
  edit controls only after an explicit edit action.
- Keep main admin destinations in the grouped left sidebar. The Dashboard brand
  is the single landing-page link and My Work is embedded in that page; Inbox,
  Site, Analytics, Users & Access, Source Data, Airtable, import tools, and
  content destinations remain sidebar links. Do not duplicate them in a
  site-wide horizontal tab bar.
- Use horizontal link tabs only inside a nested workflow or subsection, such as
  Site configuration pages, queues within Dashboard's My Work section, or the
  coherent workflow groups within Saint and Tradition review. Nested tabs use links with
  `aria-current="page"`; they are not client-side tab panels and must preserve
  normal URLs, history, and authorization gates. They should read visually as a
  connected tab strip: outlined tab-shaped controls, a selected surface, and an
  accent rule joining the strip to its content. Do not render them as pills.
- Do not add a horizontal section rail to shallow detail pages. Instagram and
  Place review keep their primary workflow and supporting cards in one readable
  stream. Saint and Tradition use normal URL-backed links with
  `aria-current="page"` and render only the active workflow's cards.

Current rollout notes:

- The root admin layout uses the grouped left sidebar for every site-wide
  destination. It does not render a horizontal workspace rail.
- Site configuration routes, internal Work queues, and Saint/Tradition workflow
  routes use the shared explicit tab-strip treatment and
  `aria-current="page"`. Instagram and Place detail pages do not show a
  horizontal rail.
- Source Data sidebar navigation contains Reconciliation, Airtable, and
  Instagram. It has no landing-page overview or combined Import History item;
  each source workspace owns its operational and preserved raw batch history.
- The Dashboard sidebar brand owns the `/admin` landing route. Individual
  workflow participants land on one consolidated My Workflow workspace with
  URL-backed Active, Blocked, and Completed queues. Available work is claimed
  from the relevant content review page. Shared team
  metrics and the Team workload queue are reserved for roles that manage
  assignments. Neither Dashboard nor My Workflow is repeated as an Operations
  sidebar item.
- Submitted long-form editorial revisions are an actionable Dashboard section
  for Site Admin and Editor roles. They are not duplicated as a site-wide
  sidebar destination; the legacy queue URL redirects to the Dashboard section.
- Instagram item detail is the first polished pilot. `Connect this Post` is the
  primary workflow. First Page Biodata starts as a six-field summary, keeps
  first-page source text out of the default summary, and places parse actions at
  the start of edit mode with save actions at the bottom.
- Saint detail is the second pilot. Publish Readiness contains the decision,
  matched Instagram posts, and review snapshot. Summary contains Overview,
  Key Facts, relationships, and Instagram claims; aliases are part of Overview.
  Biography contains the biography and sources, while Media owns images.
- Homepage configuration uses a responsive two-column workflow on wider
  screens, with a full-width Featured Traditions section whose placement cards
  can sit beside one another. Media previews use the compact admin image width;
  precision sliders live in the synchronized larger editor rather than in the
  default scrolling form.
- Images sit near biography because they support the public profile review,
  while sources, snapshots, aliases, and other references remain collapsible.
- Tradition detail follows the same model. Publish Readiness contains the
  decision and Merge Duplicate. Summary contains Overview and Key Facts;
  Content contains lineage, long-form sections, related links, and scriptural
  basis; Media owns tradition images. When merge tools are unavailable, the
  readiness workflow fills the decision area instead of reserving an empty
  merge column.
- Place detail follows the same model without inventing a publish status. It
  starts with Public Place Readiness, keeps Merge Duplicate near the decision
  workflow, connects place unit, parent state, localities, and country in
  Overview, and uses searchable relationship controls for hierarchy editing.
  Its readiness workflow also fills the decision area when merge tools are
  unavailable.
