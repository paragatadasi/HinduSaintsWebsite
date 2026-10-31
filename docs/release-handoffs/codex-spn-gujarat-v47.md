# Release Handoff: codex/spn-gujarat-v47

- Status: `ready`
- Branch: `codex/spn-gujarat-v47`
- Commit: `8c948c93fee2834dc8bf9652584c75c1cf2e957a`
- Owner/agent: Citra
- Bundle priority: immediate user-requested deployment after integrated verification

## Summary

- Load the approved Gujarat 19 into West / Vitrine 47 with six locality groups, live bring-from locations, existing placement/decline controls and full current-occupant clearing.
- Preserve current tiers, living tags, identities, physical placements and later curator destinations. Checking a placement does not accept an exact shelf.
- Keep the 5.11 / 5 shelf estimate visible; living saints use the bottom shelf first and second-from-bottom if needed. No invented family edges or exact shelf recommendations.

## Verification

- `npm run prepare:deployment`: passed (Prisma generation and TypeScript).
- `npm test`: 860 passed, 1 skipped, no failures. Targeted V47 tests rerun after final packet correction: 3 passed.
- `git diff --check`: passed.
- Branch `npm run codex:verify`: compilation, type check and page generation passed; standalone tracing failed with Windows EPERM mkdir under .next/standalone/node_modules. Release captain must pass integrated codex:verify in the persistent release workspace before pushing deploy.
- Native before/after catalog audit: all 19 at destination 47; 18 proposed updates, one already there. All identities, tiers, source revisions, current revisions/locations and original locations preserved. No outside-scope destination changes. Nadi independently confirmed.

## Deploy Notes

- Migrations: none.
- Environment variables: none. Airtable delivery remains disabled.
- Data/backfill: approved native proposed updates already saved; do not replay them. No physical moves performed.
- Exact guide version: spn-west-v47-2026-10-31-v1.
- Check `/museumadmin/move?phase=west47&vitrine=47`: West contains 47 and its approved 19 entries, six city groups and living/fit guidance.
- Full planner currently retains 19 other earlier fallback proposals for 47 (38 total). Those are outside this approved guide and intentionally untouched pending separate reviewed reconciliation. Do not present 38 as this guide's approved roster or reassign them automatically.
- No 48+ candidate or superseded Maharashtra47 packet included.

## Risk And Conflicts

- Shared areas: move page phase registration, guide registry, companion navigation/addition phase routing, physical-location confirmation guard.
- Scoped clearing is allowed only for 47 and sends current contents to staging through existing workflow. No clearing was executed by this load.
- Rollback: revert code; preserve audited proposed destinations and all subsequent curator actions. No automatic data rollback.
- Data workflow review found no new reusable interpretation rule; existing skills cover current-place preservation and locality-versus-family distinctions.

## Release Captain Notes

- Integrated into main: pending.
- Pushed to main: no.
- Merged to deploy: pending.
- Production workflow: pending.
