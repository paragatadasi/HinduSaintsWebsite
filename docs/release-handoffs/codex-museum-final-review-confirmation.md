# Release Handoff: codex/museum-final-review-confirmation

- Status: ready
- Branch: `codex/museum-final-review-confirmation`
- Commit: `12bac924ccea846cfa945cf2865383a7ac2149f5`
- Owner/agent: `Nadi`
- Bundle priority: immediate release candidate

## Summary

- Track final placement review separately from historical physical moves; confirm move plus review atomically only when needed, and clear review without undoing the move.

## Verification

- dev:check passed; seven focused domain/client tests passed; disposable PostgreSQL final expanded verifier passed exit0 at12bac92 (including six atomic review moves and injected failure rollback). Full codex:verify passed exit0 with webpack compile at907e78e and current type stage; release captain must build final combined tip containing12bac92. Evidence logs and exit files are saved outside the repository in the parent visualization directory.

## Deploy Notes

- Migrations: 20261102160000_museum_final_review_confirmation: additive nullable review marker fields, indexed review timestamp and receipt source-evidence safety flag. Run in release phase before new runtime.
- Environment variables: none
- Data/backfill/release steps: No production backfill or data writes. All existing records start finallyReviewed=false. Backend commits907e78e and12bac92 are already integrated into Citra's codex/final-review-confirmation branch; prefer the combined branch and avoid duplicate integration.
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: Final review domain/service/catalogue overlay, physical confirmation transaction reuse, Prisma schema/migration, source-level proposal guard and concurrency verifier.
- Expected conflicts: Coordinate integration with Citra's final-review-confirmation UI branch. No standalone backend deployment requested ahead of combined UI. Preserve existing confirmed placements and all Sikh-row retention proposals.
- Rollback notes: revert `12bac92` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
