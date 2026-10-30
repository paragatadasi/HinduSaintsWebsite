# Release Handoff: companion addition errors and destination ownership

- Status: `ready`
- Branch: `codex/companion-addition-visible-errors`
- Commit: `faa512758fa563f2b895bd7ac4bf04ea82a0e993`
- Owner/agent: Citra
- Bundle priority: immediate live-curator fix

## Summary

- Show and focus the actual failed confirmation message inside the destination dialog. A proposed destination remains distinct from a physical move.
- Unknown/failed transport retries reuse the exact pending physical request without posting another proposal; edits are frozen for that retry. Known conflicts refresh current revisions and retain the saved addition version.
- Resolve receiving-guide display ownership deterministically. An addition to V36 goes to the existing starter-row card rather than Northern's transfer stub. Remove the emptied duplicate stub and redirect an open removed card to its owning guide.

## Verification

- `npm run dev:check`: passed.
- `npm test`: 760 passed, 1 skipped, 0 failed.
- `npm run prepare:deployment`: passed.
- Actual-component browser harness: 409 error visible/focused inside dialog; retry uses refreshed revision; 500 retry retains exact physical request and no repeat catalog write; V36 selects starter context and redirects Northern to starter V36. Both scenarios passed with mocked requests only.
- Browser harness: local artifact `companion-parchment-qa/addition-error-check.cjs` in Citra's visualization root.

## Deploy Notes

- Migrations: none.
- Environment variables: none. Airtable stays disabled.
- Data/backfill/release steps: none. No physical records changed, and no backend receiver/clearance/handling guards changed.
- Queue/deploy trigger: ready now; coordinate with ongoing release.
- The original production Kanupriya confirmation failure is not yet diagnosed. Nadi's read-only audit finds valid addition36 and prepared36; this patch exposes the real error and provides safe retry, not a claim that every backend failure is fixed.

## Risk And Conflicts

- Shared areas: companion parent, museum search, addition display projection.
- Expected conflicts: integrate after already-released shelf coverage; branch descends from that work. No backend changes.
- Rollback: ordinary code rollback; all saved destinations and physical receipts remain intact.

## Release Captain Notes

- Integrated into main: pending
- Pushed to main: pending
- Merged to deploy: pending
- Production workflow: pending
