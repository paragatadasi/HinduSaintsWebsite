# Release Handoff: codex/museum-relic-review

- Status: `ready`
- Branch: `codex/museum-relic-review`
- Commit: `53d41733319dfbed06e1bc060def04033a8fd826`
- Owner/agent: Museum Data Integration
- Bundle priority: immediate release candidate

## Summary

- User explicitly chose current museum data as the initial relic/location baseline, without approval of every existing relic. New saint creation is deferred.
- Adds Source Data > Museum updates > Relics: connect clear existing source rows directly; queue only unresolved identities/locations and later source changes. Accepted items survive refreshes, with keep/confirm/defer/reopen decisions and location history.
- Private saint modal displays individual relic locations and suppresses the temporary saint-wide vitrine when inventory exists.

## Verification

- npm run prepare:deployment: passed.
- npm run codex:verify: passed production build.
- npm test: 232 passed, one guarded database test skipped.
- Disposable integration: direct baseline, multiple locations per saint, replay/no duplicates, unresolved links, preserved accepted state, keep decisions, stale evidence rejection and location history passed. 1,304-row source-sized baseline/replay passed in 12 seconds.
- Local authenticated production-page checks: Site Admin writes available, Data Admin read-only without museum capability, curator alone denied Source Data, anonymous streamed redirect without relic data. No production data read/written.

## Deploy Notes

- Migrations: none; depends on existing museum collection foundation and prior museum update release.
- Environment variables: none new.
- Data/backfill/release steps: no automatic backfill. Authorized Site Admin (or combined source/museum roles) refreshes Museum updates then selects Connect relics from current mirror. Each clear Relics row creates an item, existing saint links, and agreed location from its linked Saints source rows. Missing/conflicting locations are unknown; missing saint identities remain unconnected. No new saints or public content.
- Queue/deploy trigger: ready under user's standing authorization for each checkpoint and coordination with Release Captain.

## Risk And Conflicts

- Shared areas touched: museum saint modal, Source Data museum page cross-link, museum integration documentation. No shared schema/styles changes.
- Expected conflicts: preserve any independent modal changes.
- Source scoping: Website SPN base only. No source deletion, cross-museum import, automatic duplicate-item merging, or saint-description splitting. Proposed future moves remain a separate workflow.
- Transactions use shared advisory lock and serializable isolation. PGlite does not certify real PostgreSQL concurrent-session behavior. Live authenticated baseline/curator sample remains unverified.
- Rollback notes: revert feature code; preserve any imported inventory/audits and placement history. Do not remove production data automatically.

## Release Captain Notes

- Integrated into main: pending
- Pushed to main: no
- Merged to deploy: pending
- Production workflow: pending
