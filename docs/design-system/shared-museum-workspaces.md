# Shared museum workspaces

[Design system index](../design-system.md)

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
[museum-data-integration.md](../museum-data-integration.md#curator-ux-revamp-current-checkpoint-3-october-2026).

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
