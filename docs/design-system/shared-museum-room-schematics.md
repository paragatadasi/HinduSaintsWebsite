# Shared museum room schematics

[Design system index](../design-system.md)

### Shared museum room schematics

`MuseumRoomPlan` accepts a versioned `MuseumRoomLayout` configuration for irregular museum rooms. Geometry (grid coordinates and spans) is data, so numeric inline grid placement is intentional; colors, typography, spacing and responsive behavior remain in shared tokens and classes. Existing Vrindavan rendering remains the default when no layout is supplied.

Use `museum-room--schematic`, `museum-layout-workspace`, `museum-layout-list` and `museum-layout-legend` for room inspection. New spaces use the theme-derived new-space token; future spaces have dashed outlines and explicit text; walking-stick restrictions have both a label and accent outline. Selection is independently outlined. At narrow widths the detail panel stacks, the schematic can scroll horizontally, and a list alternative preserves readable access. Do not infer measured capacity from schematic cell size.
