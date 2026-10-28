# SPN v16 proposal and starter guide

Prepared on 28 October 2026. The proposal projection is staged in `lib/spn-v16-release.ts`; selecting it as the active default requires the explicit activation approval requested after automatic approval review rejected that switch. Do not deploy the new guide with an older default proposal.

## Data contract

- Full proposal: `data/museum/spn-starter-reviewed-proposal-v16.json`, version `spn-highlighted-anchor-city-refinement-2026-10-27-v16`. All 1,423 source observations and three separate named-only records retain their original source coordinates, canonical bindings and baseline curator revision tokens.
- Guide: `data/museum/spn-starter-move-guide-v3.json`, version `spn-starter-move-guide-handoff-2026-10-28-v3`. The seven starter cases contain 135 source observations. Four previously confirmed observations now have proposed destinations outside those cases and appear as explicit transition rows.
- Guide content is pinned by its canonical content digest. Its assignment digest covers the complete sorted source-ID/destination list, not just the starter subset.
- The 23 reported physical placements remain unchanged: 18 in 27 and five in 28, dated 27 October, with shelves unspecified. Changing the guide does not submit another confirmation. Historical receipt lookup is independent of guide version and remains valid after a later move.
- The explorer projection derives case counts, space estimates, assignments and anchor names from v16. Older derived metadata is evidence history only. Unknown dimensions and positive space overages are retained; these estimates do not certify physical fit.
- Newer curator arrangements take precedence through the existing reconciliation reader. No Airtable write, canonical merge, publication or physical-move confirmation is part of this release.

## Review and movement safeguards

Five reviewed source observations mention a complete or ambiguous stick within a mixed description. The source-level planning destination does not authorize moving the whole assembly. Both the direct confirmation endpoint and older move-session execution paths enforce these holds. Explicit fragments, covers and bags do not inherit a complete-stick restriction.

The 529 locality cohorts are reference-only. No alternative move action is registered without an explicit reviewed target list. Family, city and row suggestions retain distinct meanings.

Guide v2 is preserved as an immutable historical definition. Its decisions remain readable; superseded-guide saves are rejected. A prior decision can appear in v3 only when suggestion kind, exact source set and target match. An explicit v3 decision, including a restored pending state, wins. Inheritance does not write database rows; its first explicit v3 save uses version zero.

## Verification and release

The focused regression suite covers source and revision-token conservation, all 29 reviewed case estimates, guide membership and destinations, historical physical facts, transitions, decision inheritance and counterexamples, housing enforcement and fragment counterexamples. Run `npm run dev:check` after integration. The release captain owns the combined production build and deployment confirmation.

Release the backend/data and Citra companion changes together. No migrations or new environment variables are required. Preserve the prior release artifacts for rollback; reverting the application release must not delete physical-location records or historical decisions.

## Workflow learning

The museum-data-interpretation skill now distinguishes whole or ambiguous sticks from associated fragments and housing, and warns against treating an unsupported normalized country as independent evidence for an ambiguous raw toponym. Dated examples are in the skill's project-evidence reference. Skill validation passed; the identity skill needed no new rule for this release.
