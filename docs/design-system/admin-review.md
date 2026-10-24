# Admin review UX direction

[Design system index](../design-system.md)

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
