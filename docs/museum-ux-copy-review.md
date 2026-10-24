# Museum Admin copy review — 24 October 2026

This pass applies the approved contextual pilot v2 and reviews the surrounding Museum Admin experience. Public pages, general CMS copy, data, statuses and workflow behavior are outside scope.

## Approach

Review the curator’s immediate task and surrounding controls first. Keep, remove, move or rewrite each explanation according to whether it helps choose, act, understand a consequence or recover. Occasional guidance belongs near the relevant control, often behind a disclosure. Required acknowledgements and uncertainty stay visible at the decision.

## Applied changes

| Surface | Change | Reason |
| --- | --- | --- |
| Identity review | Remove the generic physical-move disclaimer; retain the change table and specific action. Change acknowledgement to “approve the identity changes shown above.” | The table defines the effects; the acknowledgement covers linking, relinking and unlinking. |
| Review note | Move “Add a note for ‘Different saint’ or ‘Unsure.’ The review stays open.” beside the field and associate it with the textarea. | Explain why those actions require a note before the curator reaches the buttons. |
| Proposal editor | Remove introductory paragraphs repeating the tier, family and section controls. | The form and destination preview already explain the action. |
| Display family | Add collapsed “Display family or historical relationship?” guidance beside the family control. | Keep the distinction available without making everyone read it. Both callers provide the historical relationship editor below. |
| Section destination preview | “Check the updated destination before saving.” | Keep the consequence beside the dynamically calculated destinations. Individual and family callers retain their save guards. |
| Move companion | Show the result count alone; move partial/uncertain guidance into both exact and flexible completion forms. | Guidance appears when confirming completion. |
| Physical confirmation | Use “checked in person”; simplify the incomplete-inventory acknowledgement. | Plain language with the same required confirmation and distinction from individual relic records. Shared saint/family arrangement forms use matching language. |
| Planning search and layout | Remove repeated assurances that browsing does not change the plan. | Search and selection already communicate exploration. Assignment and diagram-save consequences remain explicit where relevant. |
| Family/individual assignment | Remove instructions repeated by selection buttons; retain “Largest families first.” Remove the redundant optional-shelf placeholder. | Preserve clear labels while reducing reading before repeated tasks. |
| Connected traditions | Put multi-select/keyboard guidance and room-mapping explanation in adjacent disclosures. | Preserve all guidance, including diagram-only effects and capacity limitations, without dominating the map. |
| Relationship review | Make the example cover additions as well as corrections; describe the request going to the editorial team. | The action creates a reconciliation issue, not a direct relationship edit. |
| Family trees | Remove the instruction to open a family; retain reference-evidence qualification. | The expandable rows provide the interaction cue. |
| Vrindavan inventory | Remove the outdated statement that move recording will follow later. | Move companion is already available. Inventory granularity and identity-review caveats remain. |

## Reviewed and retained

- Proposal selection, suggested plans and clearing: saved-plan consequences, retained physical placements, targeted-move scope, frame/space estimates and held cases.
- Section areas: fixed Vitrine 11 constraint, removing an area, saved versus unsaved changes, destinations outside an area, single-vitrine assignment and flexible-placement rules.
- Family moves and membership: included members, cross-section scope, exceptions, detachment/restoration effects and historical relationship independence.
- Search, inventory, location browser and saint profiles: visible labels, empty/loading states, source-only records, missing biographies and identity uncertainty.
- Packaging summaries: source entries versus physical objects, shared entries, unknown/conflicting evidence and photo-versus-container distinctions.
- Trees and connected traditions: historical context versus holdings, reference evidence, incomplete graphs, relation types, saved diagram scope and error recovery.
- Collections and placement review: current versus planned locations, stale-save handling, missing identity links and reconciliation actions.
- Navigation, section summaries and vitrine contents: task labels, status labels, counts and priority distinctions.

The legacy SPN placement-review page still speaks about confirming proposals. That reflects its existing review model; it was not relabeled as physical implementation. Any unification of that workflow needs a separate product decision rather than a copy-only change.

## Verification

- `npm run dev:check`: passed.
- Existing curator-review, move-planner, arrangement and section-destination domain suites: 36 tests passed.
- Browser-rendered production components with sample data and mocked server actions: checked family-help disclosure, identity selection/acknowledgement guard, uncertain-save lock and reload recovery, exact/flexible move confirmations.
- Browser fixture has no database connection; it does not establish authenticated production persistence. Server action implementations and validation are unchanged.
- Diff review: no schema, auth, route behavior, data mutation, status or action changes. Native required inputs and disabled/save guards retained.

## Ongoing guidance

The project AGENTS file now includes contextual UX-copy rules. Keep these alongside the separate data-workflow learning instructions; neither replaces the other. Future copy changes should use the UX Writing & Content Design skill when available, with these repo rules as a portable baseline.
