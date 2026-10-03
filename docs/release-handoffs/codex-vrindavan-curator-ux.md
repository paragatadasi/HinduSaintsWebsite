# Release Handoff: codex/vrindavan-curator-ux

- Status: `ready`
- Branch: `codex/vrindavan-curator-ux`
- Commit: `dddbdb7`
- Owner/agent: Simple UX Fixes
- Bundle priority: immediate Vrindavan curator pilot requested by user

## Summary

- Direct SPN and Vrindavan admin subtabs; separate protected Vrindavan inventory workspace at `/vrindavanadmin`.
- Shared museum shell, authentication, inventory filters, detail dialogs and biography/photo components, used by SPN and Vrindavan for synchronized future UX changes.
- Vrindavan source inventory cards offer saint/relic/place search, exact display/position filters, pagination, canonical saint biographies and photos, original quantities, packaging, places, comments and source warnings.
- Clearly distinguish reviewed identities/source-reported inventory from verified physical items. No object-level move actions are exposed for source observations.

## Verification

- `npm run codex:verify`: passed; existing CSS autoprefixer warnings only.
- `npm run prepare:deployment`: passed.
- Focused source inventory projection/reader/search tests: 13 passed.
- Desktop and 390px fixture checks passed; modal opening, Escape, focus return, exact position 3.4 and no horizontal overflow verified. Temporary fixture removed.
- `git diff --check`: passed.

## Deploy Notes

- Migrations: none.
- Environment variables: none.
- Data/backfill/release steps: none. Reads reviewed inventory already stored by source workflow.
- Queue/deploy trigger: ready now, pilot requested today.
- Dependencies: includes merge of `codex/vrindavan-curator-pilot` at 30f4515 and SPN location browser cd7fda9. Please include final data reader correction 143c2bc (latest source observation wins), not only its initial commit.

## Risk And Conflicts

- Shared areas touched: main admin nav, SPN layout, shared museum dialog/filter components, CSS/tokens, design/data docs.
- Authentication and rendering were refactored into a shared server shell; private navigation loads only after access_museum, and each data page independently checks access.
- Expected conflicts: release cleanup may already have removed ancestor handoffs; preserve cleanup instead of restoring released handoffs.
- Rollback notes: standard code rollback; no schema/data mutations.
- Broader membership/status implementation is NOT included. Isolated membership checkpoint a54b348 has no release handoff and must not be integrated yet.

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
