# Release Handoff: codex/move-display-refinements

- Status: ready
- Branch: `codex/move-display-refinements`
- Commit: `056cd19303cdc767552ff708ebbdb4411bc7218a`
- Owner/agent: Citra
- Bundle priority: immediate release candidate; curator-authorized refinements

## Summary

- Inline bring-from locations in family trees; per-vitrine saint/city search.
- Final-checklist shelf annotations and source-specific to-dos, with completion/reopening in a To-do view.
- Decline dialog with optional alternative vitrine/shelf and later editing. Preferences never record a physical move or rewrite the pinned proposal.
- Phase tabs directly above the guide controls, using preloaded phase instructions and one shared physical snapshot. Switching retains the room map and confirmed progress without page navigation or another inventory fetch.
- Immediate saving feedback; reuse source snapshot only within each physical-write transaction and fetch exact matching undo receipts instead of 1,000 unrelated audit payloads. Production timing has not yet been measured; Server-Timing added for evidence.

## Verification

- `npm run codex:verify`: passed on final combined code (production build).
- `npm run prepare:deployment`: passed (includes dev:check).
- 38 focused tests passed: companion-work domain, decline domain/inheritance, physical snapshot cache/undo, room move, starter, holds, Datta and Ram guide contracts.
- Browser fixture checks passed: inline locations, per-vitrine and phase search, save/undo synchronization, shelf save, task add/complete, declined alternative save, phase switch retaining the same map DOM and confirmed checkbox state, desktop/mobile no page overflow. Fixture API is simulated; no production writes performed.
- Nadi verified both final migration SQL files in isolated PostgreSQL16, including existing-decision preservation, exact shelf text3.10, task completion/reopening, preference constraints and clearing. Disposable databases removed.

## Deploy Notes

- Required migrations BEFORE code promotion, in release/migrate phase (not build): `20261028120000_museum_companion_work` and `20261028121000_museum_decline_alternatives`.
- First adds MuseumCompanionShelf and MuseumCompanionTask; second adds nullable alternative fields and consistency constraint to existing decisions. No destructive/backfill operations.
- Environment variables: none. Airtable delivery remains disabled.
- Existing confirmations, decisions, intake drafts/submissions/photos, proposals and canonical saint content are preserved. No production data changes during development.
- Includes Nadi commits9107623, c9180d2, e4cec26 as cherry-picks cd8806a,31a1b7f,056cd19. Do not duplicate-pick original commits.
- Queue/deploy trigger: ready now; user explicitly authorized deployment when ready.

## Risk And Conflicts

- Shared: schema/migrations, physical location service/API, guide-decision service, admin tabs, companion/tree components, shared CSS/design docs; /museumadmin/move and new protected companion-work API.
- Rollback: preserve added tables/columns and data; do not drop them. Retain existing restored-recorded-state undo decoder after any undo receipts. Shelf annotations apply only to exact confirmed source/saint/vitrine/physical version; stale annotations never override a later move/undo/rematch. Metadata saves do not invalidate placement undo.
- Alternative preferences remain separate from guide-approved move destinations. Legacy clients omitting new decline fields preserve existing preferences; explicit null clears, pending/deferred clears intentionally.
- Check protected route and phase switching after hosting promotion; production speedup and private-hosting readback still require measurement/confirmation.
- Museum data skill reference updated and validated by Nadi for shelf/task semantics; no identity-rule changes.

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
