# Release Handoff: codex/live-museum-relationship-trees

- Status: ready
- Branch: `codex/live-museum-relationship-trees`
- Commit: `adf9fdb8b488a2e72d1b80d430cc0204916b1cf3`
- Owner/agent: Citra (curator UX)
- Bundle priority: immediate release candidate

## Summary

- Add a separate Live relationship trees preview panel to SPN and Vrindavan working section views; preserve original SVG references unchanged.
- Read canonical guru/disciple, partner and incarnation relationships on demand through a protected read-only API. Museum presence evidence remains separate from geometry.
- Apply documented hierarchy, partner, shortcut, lineage-color, date-hint and side-routing principles. Include keyboard saint context, fit/zoom, full evidence list and cycle/truncation notices.

## Verification

- `npm run prepare:deployment`: passed.
- `npm run codex:verify`: passed; existing unrelated CSS start/end compatibility warnings remain.
- Focused tree layout + SPN/Vrindavan projection suites: 23 passed (8 new layout invariants).
- Guarded disposable PostgreSQL `scripts/verify-museum-live-tree.ts`: passed (live refresh, reciprocal direction, pending filter, archived exclusion, read-only behavior).
- Synthetic local desktop/mobile browser checks: diagram, 100%/zoom, keyboard-opened saint context, shortcut toggle; no page horizontal overflow at 390px. Temporary fixture removed.
- Unsigned local API request returned private/no-store 401. Authenticated production session was not available; integrated release should smoke-check curator access.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none. No data writes. Depends on shared-museum-proposal-ux `60e7697` (ancestry).
- User explicitly requested coordinating directly with the release captain to deploy once verified.
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: shared section workspace, additive CSS/tokens, design/integration/security docs, new protected API and reader.
- Expected conflicts: possible append-only docs/style overlap; preserve concurrent additions. No Museum Data Integration reader contracts changed.
- Preview limits: at most 60 seeds, 120 nodes, 500 edges, 5 hops. No persistent cache; load/refresh explicitly. Different seeds in a large bounded network may show different subsets. Museum catalogue/source evidence is not physical verification.
- Published relationships shown by default; pending claims opt-in. Old exported links may not yet exist as reviewed website relationships.
- Rollback notes: revert `adf9fdb` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
