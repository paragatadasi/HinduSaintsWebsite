# Release Handoff: codex/final-review-confirmation

- Status: ready
- Branch: `codex/final-review-confirmation`
- Commit: `9071f78b8cd0ea6f01f0ed296170089a91cd2810`
- Owner/agent: `aporu`
- Bundle priority: immediate release candidate

## Summary

- Independent final placement review: existing physical moves begin unchecked; confirming saves a fresh review, while unchecking removes only the review marker.
- Finally reviewed records count as addressed in Active move. Progress has separate Move and Final review views with overall, regional and vitrine totals. Final review map fills use regional colors and review completion.
- Includes navigation fix and Unaddressed room layout from earlier handoffs; avoid duplicate integration. Includes Nadi backend commits 907e78e and 12bac92.

## Verification

- `npm run dev:check`: passed
- `npm run prepare:deployment`: passed on combined code tip 9071f78.
- 19 combined domain, client, progress, view and render tests passed.
- Nadi optimized PostgreSQL gate passed on 12bac92: six concurrent atomic saves, injected rollback, idempotency, stale guards, no duplicate physical moves, review clearing preserves location, shelf notes preserve review.
- Nadi codex:verify passed, but webpack started before 12bac92. Release captain must run integrated codex:verify on final combined tip.
- Local six-save batch improved from 47.25s to 20.31s under concurrent build load; not a production latency claim.

## Deploy Notes

- Migrations: `20261102160000_museum_final_review_confirmation` in release phase.
- Environment variables: none
- Data/backfill/release steps: no backfill or physical data rewrite; never initialize old placements as finally reviewed. Preserve the 31 audited Sikh-row proposal saves.
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: final-review API/domain/client, physical workflow transaction helper, companion progress, room map, shared CSS and design documentation, Prisma schema.
- Expected conflicts: integrate once with Nadi backend and prior navigation/unaddressed branches already in ancestry.
- Runtime smoke: existing moved record initially unchecked; confirm then reload; uncheck preserves physical location; two reviewers save concurrently; final progress and active addressed totals agree; map navigation retains Final review mode.
- Rollback notes: revert `9071f78` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
