# Release Handoff: codex/reviewed-museum-corrections

- Status: ready
- Branch: `codex/reviewed-museum-corrections`
- Commit: `9ed004a411df54579350fb9c3631a9eeb238ed8c`
- Owner/agent: `aporu`
- Bundle priority: immediate release candidate

## Summary

- One audited, repeat-safe batch applies the three user-approved geography decisions: Madhu primary Vrindavan plus Vamshi Vat, Gaudiya proposal overrides for Haridas and Madhu, and Somappar source Mayapur error recorded without changing his correct website geography.
- Protected main-admin one-click apply page and current published Vrindavan QR shortlist JSON export.

## Verification

- `npm run prepare:deployment`: passed
- `npm run codex:verify`: passed before the test-only literal typing fix; subsequent dev:check passed.
- Three domain tests and disposable database regression: passed. Protected local page application/replay: passed.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: after deployment, authenticated editor applies the approved batch once at /admin/source-data/museum/reviewed-corrections. Deployment does not automatically mutate production data. Repeat calls preserve later edits. Agent currently has no authenticated production session.
- Export /admin/source-data/museum/vrindavan/qr-shortlist supplies exact current published confirmed identities. Workspace 84-saint Excel is being produced separately at user request.
- No physical relics, placements or accepted museum assignments are changed. No saint is published. Raw source values remain preserved.
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: lib/museum-family-moves.ts getEditableMuseumProposalData, docs/museum-data-integration.md; isolated protected admin routes and correction services.
- Expected conflicts: coordinate proposal reader/UI branches; they should inherit persisted approved decisions. Somappar sourcePlaceError is available via readReviewedMuseumDecisions.
- Rollback notes: revert `9ed004a` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending

