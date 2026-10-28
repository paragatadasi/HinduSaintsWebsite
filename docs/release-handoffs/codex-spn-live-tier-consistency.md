# Release Handoff: codex/spn-live-tier-consistency

- Status: ready
- Branch: `codex/spn-live-tier-consistency`
- Commit: `eaaf5e33bdfbfab72b488574d5584f8da929c69f`
- Owner/agent: `Nadi`
- Bundle priority: immediate release candidate

## Summary

- Project current unambiguous SPN tiers into starter-entry labels without modifying immutable guide context, membership or destinations.
- Derive current proposal Primary-anchor labels from reconciled rows, including retained curator destinations. Earlier proposal metadata stays historical.
- Document the nine independently verified production corrections and remaining held research cases.

## Verification

- `npm run dev:check`: passed
- `npm run prepare:deployment`: passed.
- 14 focused projection/guide/release tests: passed, including ambiguous identities, exact-source preference, source-only holdings, guide immutability and retained destinations.
- Real after-export projection: case 78 includes Hemalata and Srinivasa as Primary; case 25 includes Sankardev and Madhavdev; case 53 includes Vallalar. Guide digests unchanged.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: no release data writes or backfill. Nine supported corrections were already saved through the normal admin workflow and before/after exported. Do not replay them or rerun the legacy proposal generator.
- Data verification: exactly eight Primary promotions plus Madhu's Secondary/early-Gaudiya correction; no unexpected arrangement, coordinate, confirmation, region, public editorial/identity or raw-source changes.
- Smoke: reload planner and companion; current tiers should agree, with Hemalata and Srinivasa Primary. Source-only observations and ambiguous identities must not inherit another person's tier. Existing 23 physical confirmations remain independent.
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: `app/museumadmin/move/page.tsx`, `app/museumadmin/plan/page.tsx`; pure tier projection helper and documentation.
- Expected conflicts: no Citra component/CSS changes. Based on main containing the concept-label release; compatible with Citra's separate parchment presentation work.
- Rollback notes: revert `eaaf5e3` and dependent presentation commits if needed. Do not undo reviewed database decisions or physical history. No schema/database rollback.
- Build verification: use the release captain's real dependency installation; the feature checkout uses a development-only dependency junction.

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
