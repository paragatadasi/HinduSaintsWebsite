# Museum design and prototype delivery

Read through [the canonical design index](../design-system.md). This topic records curator-workflow choices; it does not replace public-site guidance.

## Choose the surface for the task

- Sustained move/review work uses the approved parchment companion scope. Reuse data-museum-companion-theme="parchment" and tokens in styles/tokens.css; do not recolor the whole admin shell.
- Preserve calm serif headings, readable body text and compact metadata through existing shared styles. Reduce nesting and spacing before shrinking all text.
- Gold indicates navigation/action emphasis. Family and locality colors identify groups; name each group and show relationship labels so color is never the only explanation.
- Progress fill communicates addressed work. Final-review confirmation and unresolved flags remain distinct; a saturated case with a flag is not an unqualified completion claim.
- Use portrait rows for lists where recognition helps. Shelf arrangements use compact cards aligned to physical rows; the tree rail provides relationship context and can collapse to reclaim width.
- Keep room orientation visible alongside the selected guide on laptops. Stack on narrow screens and put secondary actions below record text instead of squeezing names.
- Use shared horizontal tabs for peer views and integrated chevrons for disclosure. Preserve the active view, vitrine, scroll context and unfinished input through navigation and remote updates.

Implementation references: components/admin/spn-room-move-companion.tsx, components/admin/museum-active-shelf-guide.tsx, components/admin/museum-final-review.tsx, styles/tokens.css and styles/globals.css. These are existing patterns, not new component APIs.

## Put information at the decision

Show locations quietly in each relevant entry. Keep proposal, current placement and final review distinguishable. A placement checkbox does not implicitly accept a suggested shelf.
Place errors and retry controls beside the action, retain input, and distinguish pending from saved.
Show existing tasks beside task creation. Defer optional evidence; do not hide essential destination or save consequences.
Remove repetitive helper copy when labels communicate the action. Preserve uncertainty that changes the decision.
A new data import must not silently overwrite a curator's later decision.

## Select skills by the uncertainty

| Need | Skill |
| --- | --- |
| Compare genuinely different workflows | emil-prototype |
| Establish hierarchy and spacing | emil-design-foundations, then emil-typography if needed |
| Validation, pending states and recovery | emil-forms-and-inputs; ux-writing-content-design for wording |
| Touch/keyboard or narrow-screen problems | emil-touch-and-accessibility |
| Slow interactions | server diagnosis first when requests are slow; emil-performance for rendering |
| Review an implemented interface | emil-ui-review or emil-ui-polish |

Read only the skills that address the task. Their examples do not override repository APIs, authorization, curator decisions or measured framework behavior.

## Prototype to production

1. Use the same representative data in alternatives: a large branching family, multiple primaries, a long name, an empty case, flags, and a narrow viewport.
2. Save the accepted prototype/version and its key decisions with the feature handoff.
3. Inventory existing tokens/components before implementation. Promote repeated patterns to shared styles/components.
4. Compare prototype and implementation at the same viewport and state: hierarchy, density, color, control position and tree geometry. Functional equivalence alone does not demonstrate visual fidelity.
5. Exercise loading, empty, pending, failed-save, retry and concurrent-update states. Test the assistant role as well as admin.
6. Record any deliberate departure and its reason. Do not claim visual QA from a static screenshot when the relevant interaction was not exercised.

Example: keep the approved map-and-guide arrangement and replace sample rows with live records. Do not recreate the screen as a generic stack of cards and plan to restore the design after launch.

Shuffle Guide uses the companion parchment theme, sequential sections and compact labelled checklist rows. Keep fit notes adjacent to actions. Conditional actions are visibly labelled and excluded from required progress. Shared checklist completion never writes inventory locations; stable action IDs survive copy edits.
