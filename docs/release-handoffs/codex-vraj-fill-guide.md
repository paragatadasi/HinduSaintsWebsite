# Release Handoff: codex/vraj-fill-guide

- Status: ready
- Branch: `codex/vraj-fill-guide`
- Commit: `3e2a3ad`
- Owner/agent: `Citra`
- Bundle priority: immediate release candidate

## Summary

- Approved Vraj v17 overlay, 79/77 fill guide, expanded Ramakrishna 75/23/73/37/4 phase, colored cross-phase room navigation

## Verification

- 691 tests passed, 1 skipped; focused browser and disposable PostgreSQL checks passed; dev:check passed (including Prisma generation and TypeScript); production compilation passed, full production build gate pending captain CI

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none
- Queue/deploy trigger: test candidate for captain CI; integration requires green production build

## Risk And Conflicts

- Shared areas touched: Museum companion, room plan, latest proposal viewer, physical confirmation guards, design docs
- Expected conflicts: linked-map branch also changes spn-room-explorer.tsx and spn-reviewed-proposal.ts; preserve its map/layout/helper-copy polish and this branch’s scoped overlay/top-anchor labels. Design docs may be modularized on main; retain the canonical index and move appended guidance to its museum topic.
- Rollback notes: revert `ada7432` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending

## Required combined release

Include `origin/codex/proposal-linked-map` at `1e7d65d` (queued handoff) in this push, explicitly requested by the user. This feature branch starts at `a4106b7` and does not include that branch. Preserve linked map, narrow inspector, matching header sizes, concise saint/shelf estimate, and removed helper text. Run integrated verification after resolving shared viewer changes.

## Data and safety readback

- Latest viewer overlay: `spn-vraj-locked-2026-10-29-v17`, exact167 source IDs (153 Vraj plus14 existing Kriya entries). Vidyanand now5; all14 existing Kriya observations retained. Fresh captured CMS revision tokens from Nadi's29October snapshot preserve later curator choices. Two source-only identities remain held.
- Vraj phase: `/museumadmin/move?phase=vraj`, 79=17 and77=23. Both require explicit on-site availability acknowledgement. Zero indexed occupants is not empty-case proof. No automatic clearing.
- Ramakrishna phase: `/museumadmin/move?phase=gosaiji-sai`, ordered75,23,73,37,4;75distinct guide entries.75/23/73 require readiness;37/4 retain prior clearing rule and recognize the old37 clearing receipt. Earlier equivalent decisions and all physical ledger history are retained.
-23 requires both exact outgoing full-height observations confirmed in approved70/final18 before filling.70 readiness required, exactsource23→70 exception only. Uniform's planned18 remains unchanged. Undo back23 relocks incoming placements. No broad fixed-housing bypass.
- Museum map: available phases colored with region palette, unavailable cases faded/disabled. Clicking switches phase and selects case; saves block navigation.
- Nimbarka–Kathia10 remains a flat tradition group, not a guru tree. Gayatri couple has one spouse edge; four other Mathura entries are locality context. Top38 labels apply only to Devraha2 and Kripalu2 observations, not disciples. No new Vidyanand→Keshavananda guru edge.
- Current physical origins come from the shared ledger. No production physical writes, proposal backfills, migrations or environment changes in this feature. Airtable delivery remains disabled.
- Nadi independently applied approved Kripalu/Devraha tier updates and Vidyanand Planned5 and verified all1423 physical rows unchanged. Ask Nadi to verify actual hosted167/40 projection after promotion.

## Verification details

- Focused guide, transfer, overlay tests:10passed; complete suite691passed,1skipped.
- Real component browser fixture: exact fixed-housing transfers, both prerequisites, undo relock, cross-phase79→73 navigation, faded disabled cases, region attributes and390px containment passed; no browser errors.
- Disposable PostgreSQL:70preparation required, both23outgoing moves required, request replay safe, undo relocks, incoming23 succeeds, finalplanned18 unchanged. Test database only.
- Skills reviewed: museum-planner and UX writing. Nadi found no additional reusable interpretation rule changes needed for this release.

