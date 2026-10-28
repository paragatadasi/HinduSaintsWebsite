# Design system

The visual identity may change, so styling must be centralized.

Reusable designer role instructions live in [Designer roles](design/designer-roles.md):
Admin / Workflow Designer and Public Experience Designer, with explicit Editorial
and Creative modes for public work. Use these alongside this design system.

Token files:

- `styles/tokens.css`
- `styles/globals.css`

Configuration:

- `lib/site-content.ts`

Reusable component folders:

- `components/ui`
- `components/layout`
- `components/saints`
- `components/traditions`
- `components/places`
- `components/content`
- `components/instagram`
- `components/admin`

Rules:

- All design and layout changes should start in the design system.
- Use tokens for broad visual direction: color, type, spacing, radius, shadows, widths, and image treatments.
- Public theme rollout should favor calm museum-like hierarchy through shared
  tokens before page-specific restructuring. The `nocturne` theme is the active
  public baseline: keep borders soft, star texture quiet, and gold accents
  selective so existing public templates, including the Tradition detail page,
  remain visually consistent while structure-level redesign awaits approved
  mockups. On dark themes, surface contrast should read as subtle but
  unmistakable; if a panel separation feels barely visible in design review,
  strengthen the token contrast before adding page-specific effects.
- Use shared CSS classes for repeated layout patterns.
- Use shared components for repeated UI behavior and variants.
- Use `SearchableMultiSelect` for compact admin relationship pickers that need
  searchable multi-select checkbox behavior without filling the initial screen.
- Use `SearchableRelationshipPicker` for additive review workflows: clicking a
  search result adds it, selected rows own removal and relationship metadata,
  and an unmatched search can open the smallest useful create form.
- Use page files to compose design-system pieces, not to define new one-off visual systems.
- Do not hard-code colors, fonts, spacing, shadows, radii, widths, or image treatments in components.
- Do not add inline styles for design/layout changes unless the exception is explicitly justified in the change.
- Use design-system configuration for active reusable layout variants. Once a
  page has a selected production layout, remove exploratory toggles and stale
  alternate compositions so public routes have one clear template.
- The active public homepage layout is `cosmic`, configured in
  `lib/site-content.ts` and documented in `docs/design/themes.md`. Homepage
  refinements should preserve the cosmic blue/gold star-field identity, shorter
  hero, map preview, quote-of-the-day panel, featured tradition panel, and
  Instagram rail unless a new approved layout replaces it.
- Use `.section-heading` for section titles and section-level actions; avoid ad hoc heading wrappers in page layouts.
- Keep vertical rhythm in shared layout classes where possible. If one page needs special tuning, add a page-scoped hook such as `.saints-index` before changing global spacing utilities.
- When moving or removing a section, replace any spacing that section provided intentionally. Do not let a decorative band or content block be the only source of layout breathing room.
- Use `.card-grid` for catalog-style card collections whose card widths should stay stable when filtering changes the result count. Adjust `--width-card-grid-min` and `--width-card-grid` instead of adding page-specific grid column rules.
- For horizontal rows, use `ScrollRail`. Use `controls="always"` when arrow controls are part of the visual design, and leave the default auto behavior for utility rails where controls should appear only on overflow.
- Keep card presentation variants explicit in shared components, such as `summary`, `portrait`, and `icon`, so index pages and homepage rails can share data without inheriting the wrong layout.
- Use the shared interactive affordance classes for clickable card-like surfaces. Apply `.interactive-surface` to whole clickable cards, `.interactive-media` to standalone clickable image tiles, and `.interactive-image-link` when only an embedded image inside a larger component is clickable.
- Interactive affordance colors and shadows belong in theme tokens such as `--color-interactive-border` and `--shadow-interactive`; movement and scale belong in layout/motion tokens such as `--interactive-surface-lift` and `--interactive-image-scale`.
- Clickable-card hover states should read as a tight light glow rather than a dark drop shadow. Scrollable rails need enough internal paint buffer for lifted cards and their glow to remain visible.
- Do not add one-off hover transforms, borders, image zooms, or clickable-card shadows in components. Add a new shared interaction class only when the existing surface/media/image-link distinction is not accurate.
- Theme-specific changes should use theme tokens in `styles/tokens.css`, not conditional component logic.
- If a visual or layout pattern appears twice, promote it into tokens, shared CSS, shared configuration, or a reusable component.
- Saint pages use shared templates.
- Biographies use the shared `Prose` component.
- Admin pages can be simpler but should still use shared primitives.
- Museum planning routes use the shared `MuseumWorkspaceLayout` focused view:
  navigation starts collapsed to give the map and arrangement workspace the
  available width. An outlined Show/Hide navigation control stays visible,
  exposes its expanded state, and restores the existing navigation on demand.
  Other museum routes retain their normal navigation. Re-entering a planning
  route resets the focused default; opening navigation does not remount the plan.

## Public saint editorial pilot

The approved saint pilot keeps the Instagram-first audience: View the Post stays
primary, the mobile hero leads with the photograph, and saint names remain
uppercase serif. Profile title size, tracking, line height and overview measure
use the saint-profile tokens. Keep eras, dates, places and traditions in one
wrapping facts group; do not add a separate guru fact or competing context panel.
Preserve the hero bottom divider, existing source typography and source links,
but omit internal source-list rules on saint profiles.

Short overviews may remain expandable until full biographies are available.
Use the editorial variant of SaintProfileSummary on public profiles, preserving
authored paragraph breaks when expanded. Private museum summaries retain their
compact variant. Do not synthesize biography text or paragraph divisions.

Hero portraits use the shared portrait aspect token. FocalImage must consume the
saved focus, calculated against the gallery's measured frame; museum frames may
have different dimensions. Keep manual focus overrides. Automatic face detection
is separate future work, not part of this pilot.

The existing photo-card rails, up-to-eight related-saint network traversal and
featured-saint fallback are unchanged. Mockup card counts are illustrative and
must never replace production recommendation logic.

## Admin review UX direction

Admin review screens should feel calm, editorial, and structured. They are for
human judgment over imported or draft material, so the design should reduce
visual noise while making the next decision obvious.

The first-page metadata review panel in the Instagram item review screen is the
pilot for this direction.

Principles:

- Compose review workflows as one coherent object, not as a loose stack of
  unrelated boxes.
- Start detail pages with one primary decision workflow. A reviewer should
  understand the current state first, then take a clear action such as confirm,
  attach, edit, publish, ignore, merge, or resolve.
- Call an assignment's operational state its `Task status` in the UI. When a
  reviewer marks a task Blocked, require and display a separate blocking reason
  so the next required action remains explicit.
- Use three quiet surface layers: darkest for the workflow container, lighter
  for review sections, and a middle tone for editable controls or suggestion
  chips.
- Keep borders low contrast. Borders should define grouping, not outline every
  element loudly.
- Avoid decorative gradients in review surfaces. Use solid token-derived colors
  unless a future theme deliberately defines a review-specific treatment.
- Prefer editorial hierarchy: a small gold uppercase eyebrow, a serif primary
  heading, a muted readiness/status line, then compact section titles with
  icons.
- Keep outer spacing calm and generous, but keep dense editing controls compact
  enough for repeated review work.
- Pin review section content to the top by default. Avoid implicit vertical
  distribution from stretched grid rows; use explicit bottom alignment only for
  actions or controls that intentionally anchor to the bottom of a card.
- Pin editable controls close to their field labels. Simple values should use
  one-line inputs, not tall controls that make the value float away from its
  label. Use asymmetric grid columns when one field is naturally shorter than
  the next field, such as `Name` beside `Alternate names`.
- Labels should be more prominent than field values; field values and imported
  text should not be bold by default.
- Buttons in review headers should be available but secondary to the content
  being reviewed. Primary actions can use gold/accent fills; helper actions
  should stay outlined.
- Suggestion chips should read as review affordances, not generic status pills.
  Accepted matches need a clearly distinct treatment using the same primary
  action token as main buttons, currently `--color-accent`.
- If a review UI pattern proves useful in more than one workflow, promote it
  from the pilot classes into shared review classes or components before reuse.
- Avoid card-within-card summary boxes. Prefer flat label/value grids, quiet
  rows, and shared review surfaces.

### Detail-page review model

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

Implementation direction:

- Use `ReviewWorkflow` for the primary decision object.
- Use `ReviewSection` for sections inside a workflow.
- Use `ReviewFactGrid` for readable current-value summaries.
- Use `CollapsibleReviewCard` for secondary cards whose open state should
  persist in `sessionStorage` by route and card ID.
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
  quiet horizontal strip: text labels above a subtle shared baseline, with a
  gold underline beneath only the active label. Keep inactive labels muted,
  backgrounds transparent, and keyboard focus visible. Use `admin-tab-strip` /
  `admin-tab-strip__tab`; legacy `admin-tabs` / `admin-tab` share this treatment.
  Do not render navigation tabs as pills or raised boxes. Status badges remain badges.
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


### Shared museum workspaces

SPN and Vrindavan use `MuseumWorkspace` for authentication, museum switching,
sidebar framing and content layout. Museum-specific navigation is loaded only
after `access_museum` is checked. Keep new museums on this shared shell instead
of copying a layout. Main admin exposes SPN and Vrindavan directly under Museum.

Inventory browsing uses `MuseumInventoryFilters` and the shared museum design
tokens. Biography-first details use `MuseumDetailDialog` and
`MuseumSaintProfile` in both museums, including shared photo galleries and
keyboard/focus behavior. Make future visual changes through these components.

Data adapters remain museum-specific. SPN has physical relic records and move
plans; the initial Vrindavan pilot has reviewed identities with source-reported
inventory entries. A source row can describe several objects. Do not present it
as a verified physical item, mark it implemented, or attach an item-move action
to an observation ID. Source evidence is concise by default and expandable.

Museum proposal cards anchor quiet status labels near the bottom; research uses
an accessible small alert control rather than repeated dominant text. Family
cards expose a small corner action and keep member saint links independently
clickable. Expandable tree headings use directional triangles. Keep provenance
and secondary controls expandable and preserve the shared biography/photo-first
dialog. Arrangement fields are shared between saint and family forms; a mixed
family state must require an explicit status selection rather than defaulting
to a destructive bulk reset. Museum-specific routes can configure read-only
controls and destinations without copying the shared dialog markup.

The implementation ledger, current workflow rules and remaining phases live in
[museum-data-integration.md](museum-data-integration.md#curator-ux-revamp-current-checkpoint-3-october-2026).

Section proposal overview and detail layouts are shared by SPN and Vrindavan through
`MuseumProposalOverview` and `MuseumSectionWorkspace`. Keep museum-specific
readers/actions separate from the shared visual hierarchy. Vrindavan reuses the
section sequence as a discussion starting point, without claiming SPN bridge
evidence or reference tree exports describe its own inventory.

Live museum relationship diagrams use shared `MuseumLiveTrees` / `MuseumLiveTreeDiagram`,
`TREE_GEOMETRY`, and tree color/type tokens. Preserve the original SVG section for
comparison during preview. Lineage color belongs to edges; museum evidence belongs
to labeled node outlines/badges. Never reuse a lineage color to imply relic presence.
Use fit/zoom, an internally scrolling viewport, keyboard-activatable nodes, and an
alternative text list. Keep evidence and secondary shortcuts inspectable. Layout
changes must preserve the regression cases in `museum-tree-layout.test.ts`.

Each live family uses the existing triangle disclosure panel, auto-loading on first
open and allowing multiple expanded trees. Keep unresolved families visible.
Label preserved-export connections as reference evidence, distinguish unlinked
source identities from museum absence, and hide shortcut controls when no shortcut
exists. Source comparison regressions live in `museum-tree-source.test.ts`.

Tree text starts at normal reading size (1rem names, 0.875rem supporting labels),
with Fit overview as an explicit zoom-out action. Geometry grows with those type
sizes. Compact mode wraps peer groups into three-card bands, ordering known birth
dates within parent branches, retaining partner adjacency and keeping subsequent
lineage generations below the whole preceding band. It is not a chronological
scale; missing dates are not invented. The original wide arrangement remains
available by disabling Compact rows. Use the shared full-screen native dialog for
an immersive workspace; retain Escape, focus restoration and saint detail dialogs.

Where original SVG references exist, show those section families first. Keep other
same-section families and individual seeds in an additional disclosure. Museums
without SVG references show multi-member families first. Option construction must
intersect family rows with the current section's placements.

Museum sidebars use shared `MuseumNavigation` groups: Museum, Curator workspace,
Section proposals, and More. Reuse the numbered section menu's circle/heading,
quiet link rows, spacing and count treatment for every group. Current museum and
current destination receive a consistent token-based highlight and aria-current;
Vrindavan section state includes the section query parameter. Museum switching is
compact, external workspace links follow the section list, and empty flow zones
are omitted. Zero-member destinations remain navigable. Both museums share the
flow-zone configuration, while counts and URLs come from their own readers.

### Curator MVP navigation and inline trees (5 October 2026)

Top-level navigation categories use the larger museum-nav heading token and plain
labels (Choose Museum, Curator workspace, Section proposals, More), without
category subtitles. Section overview belongs to Section proposals; the numbered
section browser starts collapsed. Numbered museum-zone styling remains distinct.

Inline relationship diagrams fit their container and grow to their full height;
scrolling belongs to the page or containing saint dialog, not an inner diagram.
Compact geometry reduces margins, connection lanes and gaps, with columns chosen
from available width. Full-screen mode retains explicit zoom controls. Only actual
connections are diagrammed; isolated saints and standalone list entries are not
trees. Saint overview cards show a connected relationship diagram immediately after
biography, before placement, with a token-based selected-saint highlight and an
accessible current indicator. Preserve provenance and museum-presence distinctions.
Original SVG presentation is retired; protected reference files and their source
records remain available to data reconciliation. These rules supersede the preview
comparison and inner-scrolling defaults above.

### Whole-family map and readable relationships (5 October 2026)

The shared museum tree explorer now starts with a collapsible, unlabeled whole-family
map on both desktop and mobile. Keep peers in generation rows; do not wrap them into
apparent later generations. The focused saint and immediate neighborhood are marked
on the map; museum evidence remains a separate filled/hollow treatment with a key.
A labeled saint selector provides an accessible alternative to small map targets.

Below the map, use responsive name/date cards explicitly grouped as Teachers,
Disciples, Partners and Incarnation connections. These are direct recorded claims,
not inferred ancestry. Selecting a relative changes focus; Back and Return to selected
saint preserve orientation. Details opens the biography. Full screen retains the
complete labeled graph and zoom controls. Use solid connection lines; review status
and preserved export provenance remain in expandable evidence, not line dashes.
Remove repetitive Source inventory badges and inferred head labels from cards.
The full graph uses 0.875rem names and 0.75rem dates with compact shared geometry.
These rules supersede the staggered compact-row default described above.

Placement status uses shared MuseumArrangementIndicator: clock for Proposed,
list for Planned, check for Implemented. Indicators have accessible names, native
tooltips and open existing placement details on tap; one legend explains the symbols.
Do not change arrangement semantics or imply that a family head's status covers all
members. Research remains a separate alert indicator.

### Labeled tree with corner orientation map (18 October 2026)

The main museum tree again contains saint names and dates directly on its nodes.
The separate neighborhood-card presentation is retired. A small collapsible map
in the upper-right corner provides whole-family context without covering labels.
Selecting a saint in the main tree, named selector or corner map synchronizes the
highlight; map/selector selection centers the labeled card in the main viewport.
Readable size is the default; Fit overview, zoom and full screen remain explicit.
Saint details opens biography and evidence without replacing the selected tree.
Both museums and saint overview dialogs share this renderer. Solid lines, source
provenance, cycle warnings and placement status symbols remain unchanged.

### Mobile family explorer (19 October 2026)

On narrow screens, labeled tree previews preserve ordinary page scrolling and offer
Explore tree. Only the immersive viewer captures touch gestures: one finger pans,
two fingers zoom around their midpoint. Native keyboard navigation, a named saint
selector, zoom buttons and Recenter provide alternatives to gestures. The small
corner overview marks both the selected saint and the visible diagram area; its
Fit whole family action is a large target instead of requiring taps on tiny nodes.
Names remain on the graph, and generation rows never wrap into false generations.

The mobile viewer opens saint biography and relationship evidence in an expandable
bottom panel without replacing the graph or resetting its camera. Tree settings
and source controls are collapsed by default. Both museums and saint dialogs use
the same renderer and gesture helpers; no records or relationship claims change.
Gesture geometry regression tests live in `museum-tree-camera.test.ts`.

### Museum move planner

Use `MuseumRoomPlan` for the same numbered schematic in photo setup and destination selection. Real room geometry belongs in the shared map configuration/CSS; the schematic must never imply capacity or scale. Use a compact section chooser, a brief section summary, distinct saint/photo counts, and explicit whole/partial selection. Keep setup and coverage details collapsed after setup. Mobile wraps into one readable column, preserving page scrolling and clear numbered tap targets. Saved move lists lead with saint and destination, then preserved source locations and relic descriptions. All colors, sizes and spacing use shared tokens.


### Room-first museum planning (20 October 2026)

The room schematic is the shared top-level planning surface. Select a section and tap numbered vitrines, or drag its card onto each vitrine with desktop pointer controls. Touch scrolling and keyboard selection remain native. Dropping reserves a draft area; the explicit Save section area action persists it. Show unsaved changes, preserve drafts when switching sections, and protect an older draft against another curator's saved area revision. Shared vitrines are permitted and labelled, without implying available capacity.

Below the room, show the selected section's summary and primary saints. Group selection by stable display-family IDs, not identical labels. Keep member names and destinations in expandable family lists with summary placement state and whole-family selection. Show explicitly when other family members belong to a different section; selection is scoped to this section. Bulk tertiary selection excludes existing exact/flexible plans and calls out partial-family selections. A compact sticky selection bar links back to destination controls on long lists.

Flexible placement means any one vitrine within a saved section area, never simultaneous physical presence in all of them. Exact individual destinations override the area. On move day, flexible saints join the checklist, but implementation requires one actual vitrine plus the existing physical and inventory acknowledgements. Counts never duplicate flexible saints across each possible vitrine. Manual photo-vitrine setup is retired in favor of supplied photo-presence data.

### Museum planning and move companion

The planning map opens saved vitrine contents on click. Area editing is explicit
and drag-and-drop remains an assignment gesture. Start with no section selected;
provide a clear-selection action and a cross-section saint search that opens the
saved destination or explains flexible/unassigned status. Browsing never writes.
Research and unassigned sections remain browsable without a reserved area.
One-vitrine sections preselect that destination and offer an explicit bulk assign
action for unassigned saints; shelves remain optional. Do not report missing
legacy photo tags as missing imported frame information.

Use one curator visual language across both modes: a cream serif section title, gold eyebrow and summary numbers, muted descriptive text, dark family/move cards, and a quiet destination surface. `MuseumPlanningStats` supplies the shared accessible definition-list summary. Planning uses a wider overview and a responsive family-card grid; the phone companion uses the same typography and numbers with touch-sized controls and a highlighted destination strip. Gold is reserved for hierarchy, selected states and principal actions. Supporting family/tree actions use quieter borders and smaller text. Configure hierarchy through the `museum-planning-*` shared classes and tokens, rather than per-card inline styling. Family order, selection and saved plans are independent of presentation.

### Connected planning companion and frame summaries (20 October 2026)

The protected Vrindavan planner places `MuseumConnectedTraditions` beside the room
map on wide screens, stacking below it on smaller screens. This is an interpretive
reference, not a room assignment surface. Its graph is the reviewed Saarthi dataset:
25 links, six regional parents, and two priority physical adjacencies. Solid lines
mean named documented connections; dotted lines mean curatorial adjacency, never
universal genealogy. Gold/heavier lines identify recommended adjacency, not evidence
strength. Cream selection is separate. Translucent regional fields follow dragged
nodes and convey category only. Geometry alone uses computed inline coordinates;
colors, typography and card presentation use shared museum tokens/classes.

Arrange sections shows numbered region headers, region-colored rules and nested
section cards in the shared visitor sequence. Keep the palette beside the map on
desktop so drag targets stay nearby. The selected section reuses the proposal hero,
status key, tier statistics, serif headings and dark family-card hierarchy. Region
colors are categorical exceptions to the normally restrained gold palette.

`MuseumPackagingSummary` uses Nadi's deduplicating helper for section, family,
selection, family-tree-dialog and move-day summaries. Labels count source inventory
entries: Frame, Small frame, Mixed containers, Unframed and Unknown/review. Never
multiply source quantities into frame totals or infer a measured size from “Frame”.
Sheet1 remains authoritative and photo availability remains separate. No saved-plan
or physical-location mutation is triggered by exploring the companion.

The suggested-plan entry uses the same planner surface, room schematic, review
actions and detail dialog. Preview separates provisional destinations from the
explicit load action; clear explains that later edits and implemented moves are
preserved. Frame/source comparisons remain expanded as relevant fit context,
while group members and area rationales use native disclosures. See
`docs/museum-suggested-plan.md` for the planning and provenance rules.

### Succession in museum relationship trees (21 October 2026)

Succession is a directed predecessor-to-successor relationship, distinct from guru-to-disciple teaching. Both establish ordered rows, but succession uses an open arrowhead and explicit Predecessors / Successors context labels. Preserve parallel teaching and succession evidence for the same pair. Partners retain their paired placement; affiliation alone does not invent a lineage edge. The private reader follows general relationships for five hops and succession for up to ten, within the existing 120-person / 500-connection bounds, so a ten-Guru sequence can be read from either end. These are relationship rows, not a timeline.

### Reviewed Sikh succession context

The private Vrindavan Sikh section offers a succession diagram independently of display-family membership. Its server-only reviewed reference preserves all immediate Guru succession steps and explicitly labels five context-only people without inventing website identities or museum holdings. Live canonical relationships take precedence: removed or archived saved claims must not reappear from the research snapshot. Piara Singh remains explanatory affiliation context, not a fabricated personal lineage. Source links and review date are available inside the diagram. No plan, family, inventory, or public-page data is changed by this view.

### Planner tier and family quick editing

Each planning member exposes a quiet Edit tier / family action outside its selection label. Open the shared proposal form in a dialog without navigating away or selecting the saint for a move. Tier choices read Primary, Secondary and Tertiary; Primary retains the existing Featured data value. Display-family membership and historical relationship lines remain separate. Supported tree connections use the existing permission-controlled relationship editor or review request. A quick edit preserves a current Planned destination only when the section is unchanged, in the same audited transaction; section changes and Implemented proposals still require arrangement review. Stale proposal revisions must be rejected.

### Curator identity review in plan mode

Use one expandable review workspace above the room planner. Load cases only when
opened, keeping normal planning independent of the research queue. A quiet list
selects one decision card, using the shared museum serif headings, gold eyebrows,
muted source details and existing action styles. On narrow screens the case list
and decision card stack naturally.

The decision starts with the actual identity question, source locator and evidence.
No candidate is selected by default. Selecting a supported candidate reveals an
explicit Current / After confirmation comparison before the save action. Source
identity-link changes require their own acknowledgement and reviewer permission.
Identity review must never double as confirmation of a physical move. Different
saint and Unsure retain a note and remain pending. Blocked options explain what
evidence or record review is missing. After a save, reload the queue and planning
counts; an uncertain save disables retry until the reviewer reloads current state.

### Planner hierarchy and saved diagram views

Plan destinations and Move companion use the shared AdminViewTabs component and admin tab-strip styling at the top of the workspace. Plan assistance and Find a saint form a parallel two-column tool row, stacking on narrow screens. Arrange sections uses the same eyebrow/serif-heading hierarchy; Section navigator, Museum layout and Connected traditions share the museum panel pattern. Section-at-a-glance includes saved area vitrines beneath progress and frame counts.

Connected traditions keeps Original connections and Current museum proposal as built-in view options. Named views save only normalized diagram coordinates, independently of physical move planning. Multi-selection supports a checkbox or Shift-click, with shared-delta dragging and keyboard movement. Switching away from unsaved positions asks before discarding them. Fullscreen uses the same draft and saved-view state.

The room sketch is shared geometry configuration in museum-diagram-geometry.ts. Inline coordinates are justified for the interactive drawing and room grid; visual styling remains token based. Proposal anchors use unique saved vitrines, with shared/multiple destinations labeled and stale areas excluded. Sections without usable areas sit below the room. This schematic does not imply display capacity or a new historical connection.

Plan search shows destination actions first, followed by secondary section and Saint details buttons. Saint details loads the shared MuseumSaintDialog in place, with biography, family tree and museum placement; it does not navigate away from the plan.

### Shared museum room schematics

`MuseumRoomPlan` accepts a versioned `MuseumRoomLayout` configuration for irregular museum rooms. Geometry (grid coordinates and spans) is data, so numeric inline grid placement is intentional; colors, typography, spacing and responsive behavior remain in shared tokens and classes. Existing Vrindavan rendering remains the default when no layout is supplied.

Use `museum-room--schematic`, `museum-layout-workspace`, `museum-layout-list` and `museum-layout-legend` for room inspection. New spaces use the theme-derived new-space token; future spaces have dashed outlines and explicit text; walking-stick restrictions have both a label and accent outline. Selection is independently outlined. At narrow widths the detail panel stacks, the schematic can scroll horizontally, and a list alternative preserves readable access. Do not infer measured capacity from schematic cell size.


### Museum Admin control polish

Museum controls use `--size-museum-control` (the shared 44px control target),
including primary/secondary actions, icon buttons, navigation rows and review
summaries. Allow multiline action labels to wrap and grow; do not impose a fixed
button height. Disabled actions use the shared disabled opacity and a disabled
cursor across all museum screens, not just the planner.

Use `museum-action-form` for museum mutation forms. Keep field labels in sentence
case and confirmation text at the review field scale; avoid inheriting uppercase
metadata styling into acknowledgements. Checkbox labels form a full touch row,
while the checkbox itself remains compact. Text inputs and selects use the 1rem
museum input token. Required controls and validation behavior remain unchanged.

Within the museum shell and dialogs, keyboard focus has a neutral token-based
outline. Statistics use tabular numerals. Scope wrapping rules to action rows and
identity/destination text so long names cannot widen the page. On phones, move
search and sort stack; dialogs retain safe-area padding and native focus/Escape
behavior. Keep the approved map palette and semantic regional/lineage colors.

## Shared museum navigation — selected 24 October 2026

Use the editorial navigation across SPN and Vrindavan: serif Museum, Workspace and Section proposals headings with long, restrained gold bottom rules. Museum selection is a labeled native dropdown with short names; do not repeat museum identity above or below it. Utility links remain a quiet footer.

Subsection links use the shared 0.8125rem (13px at default root) token, with 44px minimum targets. Regional groups have a compact space-1 gap, integrated chevrons and persistent per-museum/per-region disclosure state. Initial direct section visits reveal the active group unless the user previously closed it. Regional numbering and names accompany every color; gold remains the active-page cue. SPN hues follow the approved prototype; Vrindavan reuses its established six-region colors. Supplement/review groups use neutral cues. Existing permissions, URLs, section ordering and counts remain authoritative.

Chosen from the local navigation prototypes: long underlines and color cues. Rejected short rules and tinted group panels. Prototype variants are not imported into production. See docs/museum-navigation-editorial.md for verification and decision history.

## SPN room proposal explorer

See [SPN room proposal explorer](design-system/spn-room-proposal-explorer.md) for the protected v15 room view, independent review/space indicators, and preservation of current curator decisions.

### Private museum relic intake

See [relic intake guidance](design-system/shared-museum-workspaces.md#relic-intake) for required-first forms, inline errors, private photos and truthful delivery states.

### Museum assistant accounts

Use the shared admin sign-in panel and stacked form fields for username sign-in. Keep Google/email options unchanged, with the username option in an integrated disclosure. Use persistent labels, password-manager autocomplete on sign-in, inline field errors, and a busy submit state. Account creation and password reset live in Users & Access using existing collapsible review cards; never display or retain saved passwords. Password-reset copy must explain that existing sessions end.

Museum assistants see museum navigation and read-only summaries. Hide unavailable editing controls and Main admin navigation, retain exploration/search/expand controls, and provide Sign out in the museum shell. Permissions must also be enforced by server actions and APIs; visual restrictions alone are insufficient.

### Stacked museum intake

`MuseumRelicIntake` uses the approved stacked prototype: one shared Saint card,
then numbered relic cards, within the `intake-stack` shared pattern. Optional
fields use one **More details** disclosure per card. Bio documents are optional.
The local Cream/Dark appearance control scopes theme tokens to intake and keeps
16px form text, quiet gold-underline tabs, and the same layout in both themes.
Team intake, My entries, and permission-gated Curator review are separate views.
Assistant submission returns to My entries with confirmation; corrections reopen
the same form and return to curator review on resubmission. Never expose curator
actions to assistants or present a saved draft as a submitted entry.

### SPN room-based move preparation

The protected `/museumadmin/move` preparation view follows the room-based
prototype: room selection and incoming displays on the main column, staging and
optional guidance beside it, stacking on narrow screens. Reuse MuseumRoomPlan,
AdminViewTabs and shared museum surfaces. Shared `room-move__*` classes provide
the display-list and filter layouts.

Use “Original recorded location” for supplied source evidence; show later physical
confirmations separately. Planned destinations never become current locations.
Keep each source observation distinct even when several belong to one saint.
“Recorded here” is not “Confirmed here”; missing contents are not an empty-vitrine
claim. Preparation views do not write physical progress. Staging and move actions
require the durable session contract before they are enabled.

The SPN companion uses one generic **Staging area**. Do not ask the curator to
name tables or distribute displays among tables. Retain per-display location history
and explicit physical confirmation behind the minimal clear/refill actions.

### Parchment move companion

The SPN move companion uses the approved `move-room.html` prototype presentation,
scoped with `data-museum-companion-theme="parchment"`. Its palette and type scale
live in `styles/tokens.css`; `.museum-companion` shared classes own the canvas,
white panels, gold top rule, serif hierarchy, green primary actions and staging
sidebar. This explicit theme stays parchment inside either admin shell theme.

Keep the room and working content in the wider column, with staging and selected
vitrine context in the narrower column. Stack columns on small screens and let
the map scroll rather than crushing its labels. Preserve the live three-phase
workflow, saved-location evidence, review holds and defer/decline controls when
adapting the prototype. Never copy prototype sample data or local-only save logic.

For the reviewed starter row, use the `guided` companion mode: keep the room map,
then show one placement guide per vitrine, with family connections visible above
the checklist and city groups afterward. `room` mode retains the separate city
exploration workflow for less settled proposals. Do not infer guru relationships
from a locality grouping; the tree renders only the guide's supplied edges and
keeps their relationship labels, including uncertainty and non-guru connections.

### Compact move guide

The guided companion uses the shared parchment tokens, an initially expanded room map beside the guide on wide screens, and a stacked layout on narrow screens. Present families, then city groups, then one complete tiered checklist. Group checkboxes and checklist checkboxes read the same physical state and invoke the same confirmed-placement action. Keep tiers as small tags within groups; preserve relationship hierarchy when sorting tree siblings. Tree names open the shared museum dialog. Deferred/declined suggestions use compact text-labelled status chips with a Restore action; they do not change physical location.

The move guide phase navigation keeps the starter row available while loading a separately registered Datta guide. Find-a-saint search is scoped explicitly to the selected phase and combines saint name, source-reported starting vitrine and proposed destination filters. Results retain region/section context and show confirmed current locations separately. Datta omits whole-case clearance and staging controls; outgoing dependencies remain a disclosure rather than alternative proposals.
