# Release Handoff: codex/spn-junagadh-saurashtra

- Status: ready
- Branch: `codex/spn-junagadh-saurashtra`
- Commit: `b4de367ce3bb0b3c38baa1fa4d04381c955f9bac`
- Owner/agent: Citra
- Bundle priority: Immediate release candidate; native readback complete

## Summary

- Adds Vitrines 48, 49, 50 and 39 to the West companion in that order: 18, 22, 17 and 13 source entries.
- Loads Saarthi's reviewed five-shelf recommendations for all 70 entries into the existing shelf UI. Checkbox confirmation remains vitrine-only.
- Full clearing for all four receivers; current origins, recorded moves and newer curator destinations remain authoritative.
- Keeps the two V64 collection holds, shared-mala observations, Bharti identities, unknown Balaram footprint and Narsi's recorded Tertiary tier.

## Verification

- `npm run dev:check`: passed.
- `npm test`: 865 passed, 1 existing skip, 0 failures.
- `npm run codex:verify`: passed on elevated retry after Windows blocked a local build folder write.
- `npm run prepare:deployment`: passed.
- Authenticated production V47 predecessor verified after its deployment.
- New shelf visual preview uses existing components; browser file URL policy prevented opening that local artifact. No new layout or styling introduced.

## Deploy Notes

- Migrations: none.
- Environment variables: none.
- Native proposals complete: 67 guarded updates plus 3 already-correct destinations. Nadi readback and independent guide-to-catalog check match all 70 source IDs, canonical identities, source revisions and destinations. All 1,422 physical rows, confirmation history and preparations unchanged; no outside-scope destination changes.
- Private audit artifacts: `C:/Users/aporu/.codex/visualizations/2026/09/30/01a0f25f-fc6a-7fd2-a3f8-cd78f289cc5e/spn-jivan-checkbox-audit-2026-10-31/junagadh70-final-audit.json` and `junagadh70-readback-check.json`.
- No physical moves, inventory merges, tier edits or Airtable delivery changes in this release.
- User-approved packet: spn-junagadh-saurashtra-companion-candidate-2026-10-31-v1.json plus four spn-vXX-curator-guide-2026-10-31-v1.json shelf guides.
- After release: check `/museumadmin/move?phase=saurashtra&vitrine=48`, all four navigation buttons, current locations, counts and shelf cards; verify no move on page load.

## Risk And Conflicts

- Shared areas: move page, guide registry, physical confirmation dispatch, companion ownership/navigation, operational shelf registry, shelf overview heading.
- Based on V47 branch already released by Mira. Integrate only this branch's additional changes.
- Source64 holds are collection precautions, not Sikh identity claims. No blanket override.
- Rollback code independently; preserve native curator proposal records and all physical history.
- Skill review: existing museum data/planning rules cover this packet; no reusable rule change needed.

## Release Captain Notes

- Ready for integration and deployment. Data readback complete.
