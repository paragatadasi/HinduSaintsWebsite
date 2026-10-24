# Mobile family explorer (19 October 2026)

[Design system index](../design-system.md)

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
