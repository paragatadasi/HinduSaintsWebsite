# Museum planning and move companion

[Design system index](../design-system.md)

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
