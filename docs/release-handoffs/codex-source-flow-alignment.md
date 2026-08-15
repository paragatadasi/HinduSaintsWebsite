# Release Handoff: codex/source-flow-alignment

- Status: ready
- Branch: `codex/source-flow-alignment`
- Commit: `d387c02cdbb82d645d637271dd020baeff2c394d`
- Owner/agent: `Codex source-flow-alignment task`
- Bundle priority: immediate release candidate

## Summary

- Aligns the Sources & Further Reading block with the biography table-of-contents column by reusing the shared biography layout width.
- Preserves the normal responsive page gutter when the biography layout collapses on mobile.
- Adds a confirmed Leave task flow for current assignees in My Workflow and content review pages.
- Returns released work to the Available queue while preserving task notes and content edits and clearing stale blocked/completion metadata.
- Integrates aliases and short description into the Saint Overview editor, with Summary saves immediately updating already-published profiles while page publication and biography approval remain restricted.
- Opens Key Facts by default, gives tab counts secondary styling, and adds clear saved/unsaved states to Tradition and Place editors.
- Corrects the public-visibility relationship control and defaults new relationships to public visibility.
- Adds a reusable Source search and attachment flow, duplicate-source guidance, per-saint descriptions, clearer actions, and a collapsed saved state.

## Verification

- `npm run dev:check`: passed
- `npm test`: passed (159 tests)
- `npm run codex:verify`: passed before the final Summary ownership refinement; the final refinement passed `npm run dev:check` and the full test suite

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: `components/saints/saint-detail-page.tsx`, admin Saint editor/actions, editorial draft and revision contracts, admin assignment actions/components, source matching/search, `styles/globals.css`, `styles/tokens.css`
- Expected conflicts: potential overlap with concurrent saint-detail, admin Saint editor, source editor, admin assignment, or global-style work
- Rollback notes: revert `d387c02`, `d6067ab`, and `5b59114`, plus any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
