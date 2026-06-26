# Design system

The visual identity may change, so styling must be centralized.

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
- Use shared CSS classes for repeated layout patterns.
- Use shared components for repeated UI behavior and variants.
- Use `SearchableMultiSelect` for compact admin relationship pickers that need
  searchable multi-select checkbox behavior without filling the initial screen.
- Use page files to compose design-system pieces, not to define new one-off visual systems.
- Do not hard-code colors, fonts, spacing, shadows, radii, widths, or image treatments in components.
- Do not add inline styles for design/layout changes unless the exception is explicitly justified in the change.
- Use design-system configuration for active reusable layout variants. Once a
  page has a selected production layout, remove exploratory toggles and stale
  alternate compositions so public routes have one clear template.
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

## Admin review UX direction

Admin review screens should feel calm, editorial, and structured. They are for
human judgment over imported or draft material, so the design should reduce
visual noise while making the next decision obvious.

The first-page metadata review panel in the Instagram item review screen is the
pilot for this direction.

Principles:

- Compose review workflows as one coherent object, not as a loose stack of
  unrelated boxes.
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

### Detail-page review model

Start with item/detail pages, then apply the lessons to bulk/list pages. Detail
pages should have one primary decision card at first. Additional cards can be
expanded by the user and should stay expanded/collapsed for the rest of that
browser session.

Default anatomy:

- Review header: page title, status chips, source links, and one primary page
  action when available.
- Primary decision card: open by default and focused on the main resolution
  task for the page.
- Summary-first editable cards: show current values as readable facts, then use
  an Edit action to switch into a per-card form.
- Keep summary and edit modes spatially consistent. When a card switches from
  readable facts to editable controls, preserve the same field order and grid
  positions wherever the field set allows it, so reviewers do not have to
  remap the content before making edits.
- Short-field cards: compact editing for structured fields.
- Long-form cards: Markdown, imported text, biographies, notes, captions, and
  other large text areas in separate cards.
- Secondary collapsible cards: raw imports, technical snapshots, source JSON,
  advanced SEO, historical logs, and other reference material.

Use explicit per-card saving as the first implementation pattern. Cards should
have local Save actions such as `Save biodata`, `Save overview`, or
`Save lineage`; this keeps changes clear with the current server-action
architecture. Design these cards so autosave could replace explicit saves later
without changing the page structure. Autosave will require additional states for
`Saving`, `Saved`, validation errors, retry, and conflict handling.

Repeatable data should start small. For lists such as lineage saints, aliases,
or sources, show the existing reviewed rows and one editable row for new input,
with an `Add more` action instead of rendering a fixed set of empty fields.

Large option sets should use `SearchableSelect` or `SearchableMultiSelect`
rather than native selects.

Implementation direction:

- Use `ReviewWorkflow` for the primary decision object.
- Use `ReviewSection` for sections inside a workflow.
- Use `ReviewFactGrid` for readable current-value summaries.
- Use `CollapsibleReviewCard` for secondary cards whose open state should
  persist in `sessionStorage` by route and card ID.
- Use `ReviewEditToggle` when a card should start in summary mode and reveal
  edit controls only after an explicit edit action.

Current rollout notes:

- Instagram item detail is the first polished pilot. `Connect this Post` is the
  primary workflow. First Page Biodata starts as a six-field summary, keeps
  first-page source text out of the default summary, and places parse actions at
  the start of edit mode with save actions at the bottom.
- Saint detail is the second pilot. It starts with Public Profile Readiness,
  uses summary-first editable cards for overview, public fields, traditions,
  places, biography, and aliases, and places Instagram claims directly below
  public fields so reviewers can compare imported candidates with current
  reviewed values.
- Images sit near biography because they support the public profile review,
  while sources, snapshots, aliases, and other references remain collapsible.
