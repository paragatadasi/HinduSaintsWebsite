# Release Handoff: codex/v64-clear-ui

- Status: ready
- Branch: `codex/v64-clear-ui`
- Commit: `1b77f4fecc8a1f78ed5ca66b2dec08e0f337945e`
- Owner/agent: `aporu`
- Bundle priority: immediate release candidate

## Summary

- Room-map selection of Vitrine 64 opens a standalone clearing card. Confirmation includes the Shelf E walking stick; separately housed pieces stay unchanged. No incoming/ordinary outgoing/preparation permissions are broadened.
- Includes Nadi backend branch codex/spn-v64-clear-only at 9bb8e1d. Release both as one unit.

## Verification

- `npm run prepare:deployment` (including dev:check): passed
- 15 focused retained-case/component scope and read tests: passed
- Real-component browser fixture: restored 64 selection, acknowledgment gating, standalone payload (no guideContext), saved completion, included-stick staging copy: passed. No production test writes.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: no backfill or automatic clearing. Curator must explicitly confirm.
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: spn-room-move-companion.tsx plus merged backend physical-location/component-clearance contract.
- Expected conflicts: none
- Rollback notes: revert `1b77f4f` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
