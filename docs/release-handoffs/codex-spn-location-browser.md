# Release Handoff: codex/spn-location-browser

- Status: `ready`
- Branch: `codex/spn-location-browser`
- Commit: `6de716cca75afbf2c4e5bc15a1de1860c05d0129`
- Owner/agent: Simple UX Fixes
- Bundle priority: immediate intermediate curator release

## Summary

- Add protected SPN vitrine/shelf browser with section and saint/relic filters, pagination, and current-versus-planned location context.
- Keep source-only saint locations explicitly unverified and inventory-incomplete; do not invent relics or merge them into verified inventory counts.
- Link from SPN navigation and section pages; shared relics display once with all linked saints and working section destinations.

## Verification

- `npm run prepare:deployment`: passed.
- `npm run codex:verify`: passed with existing CSS autoprefixer warnings. Used real local node_modules, not a junction.
- `npx tsx --test lib/museum-location-browser.test.ts`: 4 passed (shared relics, source deduplication, other-museum/unknown locations, intersecting filters).
- Desktop and 390px fixture visual checks passed; no horizontal overflow. Temporary fixture removed.
- `git diff --check`: passed.

## Deploy Notes

- Migrations: none.
- Environment variables: none.
- Data/backfill/release steps: none.
- Queue/deploy trigger: ready now under authorized intermediate releases.
- Depends on foundation a96da43 already being deployed by captain; branch includes that ancestry.

## Risk And Conflicts

- Shared areas touched: museum layout, section route, CSS. New protected locations route and reusable browser component/domain.
- Expected conflicts: coordinate museum navigation with upcoming Vrindavan work. This browser is explicitly SPN-only.
- Rollback notes: code rollback; no data mutations.
- Working section remains existing proposal/accepted arrangement semantics until subsequent status revamp.

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
