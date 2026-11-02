# Release Handoff: codex/gaudiya-mayapur-v3

- Status: `ready`
- Branch: `codex/gaudiya-mayapur-v3`
- Commit: `fd7ad4f06a1d86edb842183f4349ce2f35379292`
- Owner/agent: Citra
- Bundle priority: immediate release candidate

## Summary

- Follow-up: room-map coverage includes checked OR flagged records (deduplicated); fully addressed vitrines saturate, open flags show ! and accessible flag count. Numeric finally-reviewed completion remains distinct. Three progress tests and dev:check pass.

- Register starter guide v7 for approved Mayapur v3: thirteen proposed destinations move to 28; historical guides and physical facts remain intact. Institutional/locality groups remain distinct from documented family edges. New shelf allocations remain unspecified for on-site choice.
- Place checklist actions below text in narrow/tablet companion containers using shared CSS.
- Restore museum-wide search/add in Final review and Unaddressed records. Destination edits use final-review proposal precedence, including the existing Already moved flow. Opening a search destination retains Final review rather than switching to Active move. Pending saves must be retried on their record.

## Verification

- Follow-up compatibility tests preserve historical cohort/v6 assertions and check current Mayapur overlay composition.
- Full `npm test`: 1,049 passed, 1 skipped, 0 failed (1,050 total).
- Follow-up `npm run dev:check`: passed.

- `npm run dev:check`: passed, including latest search changes.
- 23 guide/registry/shelf/membership/alternative projection tests: passed.
- `git diff --check`: passed.
- `npm run prepare:deployment`: type check passed; handoff initially blocked only by untracked local QA assets. Assets relocated outside worktree, then `npm run release:handoff` passed.
- Browser QA: local HTTP preview timed out. Tablet layout and final-review search need integrated browser smoke verification; no visual verification claimed.

## Deploy Notes

- Migrations: none.
- Environment variables: none.
- Nadi already completed and read back the 13 authorized native proposal changes. No additional production data script to run. Reviewed counts: 27=20, 28=13, 76=22, 29=10. No physical locations or confirmation versions changed; no duplicates. The imported packet preserves its original pre-load status text as provenance.
- Keep suppressed duplicate rec419YldTnqJc6lM excluded by existing live suppression; do not restore it as a new holding.
- Verify new guide groups and search destinations; existing current locations can legitimately remain at old vitrines until physically moved.
- No reusable interpretation change requiring skill updates.

## Risk And Conflicts

- Shared areas: starter guide registry, operational shelf projection, companion addition projection, companion search/root, global CSS, design docs.
- Preserve newer native curator edits. Current membership projection controls displayed groups; packet does not override current physical facts.
- No extra polling loop added. Search reuses existing shared catalog reads and final-review writes.
- Rollback code normally, but do not reverse Nadi's approved native proposals automatically.

## Release Captain Notes

- Integrated into main: pending
- Pushed to main: no
- Merged to deploy: pending
- Production workflow: pending
