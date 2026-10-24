# Design system

The public site uses nocturne blue, cream, and gold, expressive serif headings,
and image-led discovery. Refine this identity through shared tokens and components.
This is the canonical design index; topic docs explain when to use what exists.

## Public design

- [Foundations and approved decisions](design-system/public-foundations.md)
- [Component choices and examples](design-system/public-components.md)
- [Inventory, showcase, and maintenance](design-system/showcase.md)
- [Shared rules and public baseline](design-system/shared-rules.md)
- <a id="public-saint-editorial-pilot"></a>[Saint editorial pilot](design-system/public-saint-editorial-pilot.md)
- [Designer roles and modes](design/designer-roles.md)
- [Theme and homepage configuration](design/themes.md)
- Registry: `lib/design-system/public-registry.ts`
- Protected showcase: `/admin/site/design-system`
- Values: `styles/tokens.css`; shared visual rules: `styles/globals.css`

## Admin review UX direction

- [Admin review UX direction](design-system/admin-review.md)
- [Admin components and rollout](design-system/admin-components.md)

## Detail-page review model

- [Detail-page review model](design-system/admin-detail-pages.md)
- Read admin components and rollout above before changing review/detail UX.
- The public showcase does not redefine admin workflow conventions.

## Museum workspaces

- <a id="shared-museum-workspaces"></a>[Shared museum workspaces](design-system/shared-museum-workspaces.md)
- <a id="curator-mvp-navigation-and-inline-trees-5-october-2026"></a>[Curator MVP navigation and inline trees (5 October 2026)](design-system/curator-mvp-navigation-and-inline-trees-5-october-2026.md)
- <a id="whole-family-map-and-readable-relationships-5-october-2026"></a>[Whole-family map and readable relationships (5 October 2026)](design-system/whole-family-map-and-readable-relationships-5-october-2026.md)
- <a id="labeled-tree-with-corner-orientation-map-18-october-2026"></a>[Labeled tree with corner orientation map (18 October 2026)](design-system/labeled-tree-with-corner-orientation-map-18-october-2026.md)
- <a id="mobile-family-explorer-19-october-2026"></a>[Mobile family explorer (19 October 2026)](design-system/mobile-family-explorer-19-october-2026.md)
- <a id="museum-move-planner"></a>[Museum move planner](design-system/museum-move-planner.md)
- <a id="room-first-museum-planning-20-october-2026"></a>[Room-first museum planning (20 October 2026)](design-system/room-first-museum-planning-20-october-2026.md)
- <a id="museum-planning-and-move-companion"></a>[Museum planning and move companion](design-system/museum-planning-and-move-companion.md)
- <a id="connected-planning-companion-and-frame-summaries-20-october-2026"></a>[Connected planning companion and frame summaries (20 October 2026)](design-system/connected-planning-companion-and-frame-summaries-20-october-2026.md)
- <a id="succession-in-museum-relationship-trees-21-october-2026"></a>[Succession in museum relationship trees (21 October 2026)](design-system/succession-in-museum-relationship-trees-21-october-2026.md)
- <a id="reviewed-sikh-succession-context"></a>[Reviewed Sikh succession context](design-system/reviewed-sikh-succession-context.md)
- <a id="planner-tier-and-family-quick-editing"></a>[Planner tier and family quick editing](design-system/planner-tier-and-family-quick-editing.md)
- <a id="curator-identity-review-in-plan-mode"></a>[Curator identity review in plan mode](design-system/curator-identity-review-in-plan-mode.md)
- <a id="planner-hierarchy-and-saved-diagram-views"></a>[Planner hierarchy and saved diagram views](design-system/planner-hierarchy-and-saved-diagram-views.md)
- <a id="shared-museum-room-schematics"></a>[Shared museum room schematics](design-system/shared-museum-room-schematics.md)
- <a id="museum-admin-control-polish"></a>[Museum Admin control polish](design-system/museum-admin-control-polish.md)

## Rules for every surface

- Start in tokens, shared classes, configuration, or reusable components.
- No raw visual values or one-off inline layout styles in components.
- Theme differences belong in tokens, not conditional component markup.
- Reuse a registered component before introducing a variant or replacement.
- Update specimens and usage docs in the same change as component API changes.
- Preserve public/private content boundaries, auth, and noindex previews.
