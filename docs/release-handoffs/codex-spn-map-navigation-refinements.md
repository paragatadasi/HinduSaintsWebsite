# Release Handoff: codex/spn-map-navigation-refinements

- Status: queued
- Branch: `codex/spn-map-navigation-refinements`
- Commit: `18cb4f9cdbea24786a151a00e9fe1b8412244c33`
- Owner/agent: `aporu`
- Bundle priority: queue for next major/bundled deployment

## Summary

- Keep SPN sidebar visible; persist Browse sections across navigation; give the whole-room map full content width with details below; space vitrine selection outlines; explain source provenance once instead of on every row.

## Verification

- `npm run dev:check`: passed (including `npm run queue:deployment`).
- Actual-component browser fixture: open and closed navigation persistence across page changes; SPN sidebar visible; 8px neighbor gaps around Vitrine 35.
- Desktop 1280px/mobile 390px: no page overflow. Prototype-only saint card/portrait variants remain outside the repository and are not part of this release.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none
- Queue/deploy trigger: queued until the next requested or major deployment

## Risk And Conflicts

- Shared areas touched: museum navigation/workspace layout, globals.css, tokens.css.
- Expected conflicts: preserve concurrent shared CSS/token additions. Public designer is consolidating design docs; this branch adds a separate museum refinement note.
- Rollback notes: revert `18cb4f9` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
