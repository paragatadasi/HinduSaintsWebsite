# Release Handoff: codex/museum-proposal-diagram-default

- Status: ready
- Branch: `codex/museum-proposal-diagram-default`
- Commit: `22c35b3bfe8902a1b4a4d7b6ebf39235b9b1a0a3`
- Owner/agent: `Citra`
- Bundle priority: immediate release candidate

## Summary

- Open Connected traditions on Current museum proposal by default; Original connections and saved views remain selectable.

## Verification

- npm run dev:check passed. Local browser fresh mount and expanded dialog both show Current museum proposal selected; guide screenshot supplied to Saarthi.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: No museum data changes. Guide screenshot uses a synthetic local fixture; supplied with that limitation.
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: components/admin/museum-connected-traditions.tsx
- Expected conflicts: Based on codex/vrindavan-destination-preview at 84edf1a; integrate that ready branch first or cherry-pick scoped code commit 22c35b3.
- Rollback notes: revert `22c35b3` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
