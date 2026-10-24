# Release Handoff: codex/spn-region-application-docs

- Status: queued
- Branch: `codex/spn-region-application-docs`
- Commit: `68db4f4eb3a9dfe4754b368ad0548d4d6aad872f`
- Owner/agent: `Nadi`
- Bundle priority: queue for next major/bundled deployment

## Summary

- Document verified SPN curatorial updates and correct final Southern-only trio tags; physical layout remains separate.

## Verification

- Documentation reviewed against19:32UTC protected export and actual user decisions; git diff --check passed. No runtime changes; no tests needed.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: Documentation only; records already applied and verified via protected production UI. No backfill or operator action.
- Queue/deploy trigger: queued until the next requested or major deployment

## Risk And Conflicts

- Shared areas touched: docs/spn-scoped-proposals.md; docs/saint-contextual-relationships.md
- Expected conflicts: none
- Rollback notes: revert `68db4f4` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
