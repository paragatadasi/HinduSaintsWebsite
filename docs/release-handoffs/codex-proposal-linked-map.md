# Release Handoff: codex/proposal-linked-map

- Status: `queued`
- Branch: `codex/proposal-linked-map`
- Commit: `35973f357ea76a6c3c60b45430f92929e0dff74e`
- Owner/agent: Citra
- Bundle priority: Next requested/bundled deployment; not an immediate release request.

## Summary

- Three coordinated panels: room layout, linked geographic map, concise vitrine card. Town selection filters portrait rows using exact source IDs and effective saved destinations.
- Pan, zoom, fit-place controls; responsive stacking; vertical default preserves saved orientation.
- Narrow vitrine panel, parallel headings, saint/shelf summary; remove redundant helper, display-focus, and flexible-space blocks.

## Verification

- `npm run queue:deployment`: passed (Prisma generation and TypeScript).
- `npx tsx --test lib/spn-linked-localities.test.ts`: 3 passed.
- Local real-component Playwright preview: existing family tree, linked selection, place filtering, fit controls and 1440/1000/390px containment passed; no browser errors.
- Integrated production build remains release captain's gate.

## Deploy Notes

- Migrations: none.
- Environment variables: none.
- Data/backfill: none. Read-only locality evidence extracted from Saarthi's v16 HTML; 102 reviewed points, exact source-ID links. Unknown/ambiguous places remain unmapped. No proposal or physical-move writes.
- Airtable delivery remains disabled.
- Queue trigger: next requested/bundled release.

## Risk And Conflicts

- Shared areas: proposal explorer component/CSS; design-system documentation. New locality component/helper/data and tests.
- Design index has since been modularized on another branch: preserve its structure and move this branch's Linked proposal maps paragraph into the appropriate museum topic if needed.
- Do not silently add newer Bengal 73-to-23 content to this UI branch; coordinate final saved readback separately. Effective saved destinations take precedence automatically.
- Previous release host promotion was still unconfirmed; verify actual live version after release, not only workflow success.
- Rollback: revert feature commits; no database rollback needed.

## Release Captain Notes

- Integration and deployment pending.
