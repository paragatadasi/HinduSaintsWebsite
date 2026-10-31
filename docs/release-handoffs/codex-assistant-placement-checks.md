# Release Handoff: codex/assistant-placement-checks

- Status: ready
- Branch: `codex/assistant-placement-checks`
- Commit: `c4a06f17473e989039a1687ed3c48876aeeaf547`
- Owner/agent: `aporu`
- Bundle priority: immediate release candidate

## Summary

- Museum Assistants can check off single reviewed SPN placements without curator permissions. Includes Nadi domain code b94d571. Plan changes, clearing, shelf edits, alternative/addition confirmation and undo remain curator-only.
- Stronger dedicated shelf-group hues, tinted cards and leading borders; matching tree/legend colors with readable metadata. Regional map palette unchanged.

## Verification

- `npm run prepare:deployment` / dev:check: passed
- 15 combined permission/domain tests passed; full pre-domain suite 816 passed, 1 skipped
- Touch browser fixture: assistant placement tap, immediate Saving, persisted response, curator actions absent: passed
- Six-color visual review and contrast: minimum metadata 6.49:1; design:inventory and design:check passed
- Integrated codex:verify: passed (rerun with filesystem access after local .next EPERM; existing CSS autoprefixer warnings only)

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none. Existing assistant accounts gain capability from code; refresh companion after deployment. No physical or proposal writes performed.
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: permissions.ts, physical-location HTTP/domain, SPN companion/page, assistant account copy, shelf CSS/tokens/generated inventory.
- Expected conflicts: none
- Rollback notes: revert `c4a06f1` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
