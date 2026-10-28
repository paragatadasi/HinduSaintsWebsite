# Release Handoff: codex/spn-v16-companion

- Status: `ready`
- Branch: `codex/spn-v16-companion`
- Commit: `4fc3f30db66bb37ca89c9b5b92f04db837128e3f`
- Owner/agent: `Citra`
- Bundle priority: `SPN v16 proposal and guide bundle only`

## Summary

- Replace obsolete city-to-vitrine assumptions with explicit reviewed guide eligibility.
- Show the active proposal label, review notes and server-supplied movement restrictions.
- Keep four confirmed displays with revised destinations outside the starter row visible under their original confirmed case, with current locations distinct from suggestions.

## Verification

- `npm run prepare:deployment`: passed.
- `node --import tsx --test lib/spn-move-guide.test.ts lib/spn-starter-guide-registry.test.ts`: 9 passed against existing v2 packet.
- Nadi owns integrated v3 registry, content, API and full proposal checks; release captain owns integrated production build.

## Deploy Notes

- Migrations: none in this branch.
- Environment variables: none. Airtable delivery stays disabled.
- Required bundle: Nadi `codex/spn-v16-guide-data`, Saarthi audited v3 guide / v16 full proposal. Do not deploy this UI alone: old alternative metadata has no reviewed target eligibility.
- Preserve all existing curator revisions, 23 recorded physical placements and historical guide decisions. Do not resubmit historical moves.
- Activation approved directly by the user on 28 October: "Yes, activate v16". Release with the aligned Nadi data branch after integrated checks.

## Risk And Conflicts

- Shared areas: companion component, guide UI types and tests. Nadi may merge this branch into his feature branch for integrated testing; preserve ancestry.
- Rebuilt explorer must be reviewed with v16 assignments; main/data and companion guide must agree.
- Rollback: revert the combined code/data release, never delete physical movement or decision history.

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: not started
