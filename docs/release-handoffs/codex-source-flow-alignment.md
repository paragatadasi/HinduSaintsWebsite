# Release Handoff: codex/source-flow-alignment

- Status: queued
- Branch: `codex/source-flow-alignment`
- Commit: `d6067abd29f028f18e2b67d043c40df7acf37344`
- Owner/agent: `Codex source-flow-alignment task`
- Bundle priority: queue for next major/bundled deployment

## Summary

- Aligns the Sources & Further Reading block with the biography table-of-contents column by reusing the shared biography layout width.
- Preserves the normal responsive page gutter when the biography layout collapses on mobile.
- Adds a confirmed Leave task flow for current assignees in My Workflow and content review pages.
- Returns released work to the Available queue while preserving task notes and content edits and clearing stale blocked/completion metadata.

## Verification

- `npm run dev:check`: passed
- `npm test`: passed (156 tests)

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none
- Queue/deploy trigger: queued until the next requested or major deployment

## Risk And Conflicts

- Shared areas touched: `components/saints/saint-detail-page.tsx`, admin assignment actions/components, `styles/globals.css`, `styles/tokens.css`
- Expected conflicts: potential overlap with concurrent saint-detail, admin assignment, or global-style work
- Rollback notes: revert `d6067ab` and `5b59114`, plus any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
