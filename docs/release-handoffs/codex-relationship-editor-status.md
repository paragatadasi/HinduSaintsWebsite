# Release Handoff: codex/relationship-editor-status

- Status: queued
- Branch: `codex/relationship-editor-status`
- Commit: `a4646706ebf31321bb001f67e9efeee5c4efd007`
- Owner/agent: `Save imported carousel text`
- Bundle priority: queue for next major/bundled deployment

## Summary

- Refresh the saint Summary route after relationship changes and remount the relationship form from its saved timestamp so published status does not appear to revert in the open editor.

## Verification

- npm run dev:check passed. Browser confirmation not performed. No schema, dependency, auth, or route structure changes.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none
- Queue/deploy trigger: queued until the next requested or major deployment

## Risk And Conflicts

- Shared areas touched: Saint admin detail relationship form and shared revalidateSaintPaths helper in app/admin/saints/actions.ts.
- Expected conflicts: Branch is based on queued codex/biography-carousel-reference; integrate that branch first or confirm its commits are already included.
- Rollback notes: revert `a464670` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
