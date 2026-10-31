# Release Handoff: codex/spn-v64-clear-only

- Status: ready
- Branch: `codex/spn-v64-clear-only`
- Commit: `9c5d22450499adfb554e8cef9e1f34481a3e1566`
- Owner/agent: `Nadi`
- Bundle priority: immediate release candidate

## Summary

- Permit only an explicitly acknowledged standalone Vitrine 64 clearing to staging, including the walking stick housed there. Whole-case membership and fresh per-source/current-location checks still apply.
- Exact Bimal source uses a component receipt with includedWalkingSticks true. External housing stays unknown, with no whole-collection placement claim. Other Sikh-case actions remain protected.

## Verification

- `npm run dev:check`: passed
- `npm run prepare:deployment`: passed; 18 focused scope, receipt/correction and retained-case protection tests passed.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none
- Queue/deploy trigger: integrate with Citra's V64 clear-card-only interface before release. Deployment performs no physical write; the curator must confirm clearing.

## Risk And Conflicts

- Shared areas touched: component scope/acknowledgement union, physical confirmation service, receipt reader and correction scopes; museum data contract.
- Expected conflicts: requires Citra UI to send retainedCaseClearanceAcknowledgement and walkingSticksInVitrineStaged, omit guideContext for this standalone clearing, and label includedWalkingSticks correctly. Do not use the older 'sticks elsewhere' copy for 64. Depends on already released 19/42 backend 82c414c.
- Skills review: existing origin-component scope, uncertainty and later-revision rules apply; no reusable rule change needed. No migrations, environment changes or backfill.
- Rollback notes: revert `9c5d224` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
