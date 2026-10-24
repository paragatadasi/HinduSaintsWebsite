# Inventory and showcase maintenance

[Design system index](../design-system.md)

## Sources of truth

| Concern | Canonical location |
| --- | --- |
| Design navigation and cross-surface rules | `docs/design-system.md` |
| Public choices | This folder's public foundations/components docs |
| Roles and modes | `docs/design/designer-roles.md` and linked role guides |
| Component APIs and behavior | Component source files |
| Inventory, defaults, purpose and coverage | `lib/design-system/public-registry.ts` |
| Visual values | `styles/tokens.css` |
| Shared visual rules | `styles/globals.css` |
| Token catalogue | `lib/design-system/tokens.generated.json` (generated) |

## Protected review surface

Open `/admin/site/design-system` through Site → Public Design System.
Both this page and its companion `/design-system-preview` require `manage_site`.
Both are noindexed. The companion is outside the admin layout so the iframe has
the public document styles and real media-query viewport; it is not a public route.
The standard root public header/footer remain present with published configuration.
Preview paths are excluded from client public analytics so sample interactions
do not become public engagement counts.

This isolated frame is a justified showcase-specific layout. It is not a new
general page wrapper or a replacement public theme. Widths and height use tokens.
The width selector uses maximum widths, so a small host screen never forces a
larger viewport. Open the full preview to inspect at the browser's actual width.

Examples import production components. `fixtures.ts` contains invented records
and local assets, never a copied private CMS export. The specimen boundary prevents
navigation and form submission within examples while preserving local controls
and fragment links. Shared header/footer outside the boundary retain real behavior;
do not submit sample contact feedback. No publication or content edit is performed.

## Coverage

- `specimen`: directly rendered in the collection.
- `composition`: exercised through another component or the public root shell.
- `integration`: use its real route and review workflow behavior separately.

The registry covers files in public domain/layout/content/Instagram folders and
public UI primitives. Admin searchable pickers and StatusBadge are not public
component alternatives. Analytics and privacy infrastructure are outside this
visual inventory; their behavior remains part of production verification.

Not every prop combination is a visual variant. Data-dependent states, optional
images, and layout/controls props are named as such. Coverage does not imply that
all states or workflows passed accessibility or visual approval.

## Change procedure

1. Find the existing registry entry and component before building another pattern.
2. Read the relevant topic doc and representative production call sites.
3. Change tokens/shared classes or the component, not copied specimen markup.
4. Update its registry entry, direct example, and usage documentation together.
5. After token edits run `npm run design:inventory`; commit generated output.
6. Run `npm run design:check`, `npm run dev:check`, and relevant integration checks.
7. Review wide and narrow examples, missing/long content, focus, and reduced motion.

The generator parses custom-property declarations in the current flat token
layers and retains repeated declarations/theme overrides in source order. If
tokens move into nested CSS, update the parser before relying on the catalogue.
Do not edit generated values. The check command catches stale catalogue output.

## Consolidation boundaries

Existing public, admin, and museum rules were relocated into bounded topic files
without changing their product decisions. The central index preserves the two
admin section anchors referenced by AGENTS.md. Role guides explain responsibilities;
they do not duplicate component APIs. Theme notes describe active versus historical
configuration. New guidance belongs in the indexed topic that owns the decision.
