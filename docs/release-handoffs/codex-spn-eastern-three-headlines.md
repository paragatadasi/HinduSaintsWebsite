# Release Handoff: codex/spn-eastern-three-headlines

- Status: ready
- Branch: `codex/spn-eastern-three-headlines`
- Commit: `43fa78d80bdd80be76209d95fb31a998ca81bbdb`
- Owner/agent: Citra
- Bundle priority: immediate release candidate

## Summary

- Load approved Eastern v7 roster and shelf recommendations: 23 Anandamayi Ma (12), 24 Omkarnath and regional Bengal (12), 73 Bamakhepa/Nigamananda/Bauls (11). Update companion grouping, reviewer headings/estimates and 73 Eastern color/filter.

## Verification

- `npm run prepare:deployment`: passed. 33 focused tests passed (Eastern, region styling, additions, shelf context); earlier 34 shelf-expansion/Jamnagar tests passed. Read-only replay against Nadi after-catalog proves exact 12/12/11 membership with no extras/missing or catalog mutation. git diff --check passed.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: Nadi completed 23 guarded destination writes; 12 already correct. All 35 identity/revision guards pass; before/after physical state deep-equal and outside-proposal changes empty. No native writes in this code release. Source evidence: Nadi spn-jivan-checkbox-audit-2026-10-31/east35-final-readback.json.
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: companion addition projection, operational shelf packet assembly, reviewed proposal and shared display-region configuration.
- Expected conflicts: based on Jamnagar afcec15 (already integrated); Mira adjusted a test after that integration. Preserve the integrated test adjustment.
- Rollback notes: revert `43fa78d` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending

- Safety: preserve actual confirmed23 placements even when now proposed24. No clearance/availability, actual shelf, historical identity or relationship writes. Three living entries recommend shelf5; three unknown footprints24 remain explicit fit checks. Minati is a qualified locality group, not Jaiguru. Existing attributed tree edges only. Source-only/canonical/physical holds remain enforced.
- Skill review: no new reusable rule; existing planning and data rules apply.
- Serving verification: pending release; do not describe branch or dispatch as live.

