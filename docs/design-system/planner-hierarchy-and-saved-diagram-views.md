# Planner hierarchy and saved diagram views

[Design system index](../design-system.md)

### Planner hierarchy and saved diagram views

Plan destinations and Move companion use the shared AdminViewTabs component and admin tab-strip styling at the top of the workspace. Plan assistance and Find a saint form a parallel two-column tool row, stacking on narrow screens. Arrange sections uses the same eyebrow/serif-heading hierarchy; Section navigator, Museum layout and Connected traditions share the museum panel pattern. Section-at-a-glance includes saved area vitrines beneath progress and frame counts.

Connected traditions keeps Original connections and Current museum proposal as built-in view options. Named views save only normalized diagram coordinates, independently of physical move planning. Multi-selection supports a checkbox or Shift-click, with shared-delta dragging and keyboard movement. Switching away from unsaved positions asks before discarding them. Fullscreen uses the same draft and saved-view state.

The room sketch is shared geometry configuration in museum-diagram-geometry.ts. Inline coordinates are justified for the interactive drawing and room grid; visual styling remains token based. Proposal anchors use unique saved vitrines, with shared/multiple destinations labeled and stale areas excluded. Sections without usable areas sit below the room. This schematic does not imply display capacity or a new historical connection.

Plan search shows destination actions first, followed by secondary section and Saint details buttons. Saint details loads the shared MuseumSaintDialog in place, with biography, family tree and museum placement; it does not navigate away from the plan.
