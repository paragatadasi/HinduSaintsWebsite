# Release Handoff: codex/museum-family-tree-toggle

- Status: queued
- Branch: `codex/museum-family-tree-toggle`
- Commit: `48633fa82205a663240618866594b24cf4d8605b`
- Owner/agent: `Simple UX Fixes`
- Bundle priority: queue for next major/bundled deployment

## Summary

- Add a small filled triangle beside each family name in museum section proposal family trees: down when collapsed and up when expanded. Preserve native details/summary interaction and hide the decorative icon from assistive technology.

## Verification

- `npm run dev:check`: passed

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none
- Queue/deploy trigger: queued until the next requested or major deployment

## Risk And Conflicts

- Shared areas touched: app/museumadmin/[section]/museum-section-workspace.tsx and styles/globals.css (museum-tree-panel classes only).
- Expected conflicts: low risk; possible overlap with concurrent museum section workspace or family-tree styling edits.
- Rollback notes: revert `48633fa` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
