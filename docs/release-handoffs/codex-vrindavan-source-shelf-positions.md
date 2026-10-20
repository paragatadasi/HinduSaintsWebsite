# Release Handoff: codex/vrindavan-source-shelf-positions

- Status: ready
- Branch: `codex/vrindavan-source-shelf-positions`
- Commit: `aca69a283c4a09dedc3d0b6b320bb8e9f0c0ac0d`
- Owner/agent: `Nadi`
- Bundle priority: immediate release candidate

## Summary

- Parse curator-confirmed source row.position notation without losing row-only evidence: 3 means row3/unknown position;3.2 means row3/position2, top-to-bottom.
- Expose optional sourceShelfPosition on inventory and planner source rows; retain raw text and all saved destinations. Five rows is an editable curator working assumption, not hard capacity.

## Verification

- `npm run dev:check` and `npm run prepare:deployment`: passed.
- 28 focused shelf/packaging/inventory/planner tests passed, covering omitted positions, raw text, blank/ambiguous labels and no hard five-row parse cap.
- Small data adapter/helper change; integrated production build belongs to release captain. No routing/auth/schema/dependency changes.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none. Existing columnG already preserved; no source import or writes. Depends packaging290026e. Citra suggestion engine consumes parser while leaving proposed shelf editable/unset by default; live Gaudiya reservation17-19 must remain protected.
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: source inventory type/projector; planner source type/serialization; new pure shelf parser/tests; packaging integration docs. No UI/style/schema/migration files.
- Expected conflicts: Citra edits lib/museum-move-planner.ts/domain for suggestion IDs, tradition context and save/clear provenance. Merge sourceShelfPosition additively; preserve her fields/guards and packaging inputs. Branch ancestry includes packaging handoff; avoid reintroducing any already released handoff.
- Rollback notes: revert `aca69a2` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
