# Release Handoff: SPN display region colors

- Status: `ready`
- Branch: `codex/spn-display-region-colors`
- Commit: `9e69d46cfa964691878e70e7a6fbc6e7aac0e2d1`
- Owner/agent: Citra
- Bundle priority: immediate release candidate

## Summary

- Current reviewer and companion share the approved muted v4 display-region mapping, keyed by current physical vitrine numbers. Sikh and Bhakti Marga use gray with distinct labels and filters.
- Bridge cases 2, 5, 74, 61 and 62 use one midpoint color and match both regions. 80 remains West with North membership. 23/24 remain East; 27/73 remain neutral. No unapproved East trial or North phase split.
- Room filters, reviewer hover/inspector labels and companion card labels expose region meaning without relying on color. Earlier reviewer studies retain their captured groupings.
- Adds shared palette audit and dated planning-learning reference to the design-system documentation.

## Verification

- `npm run dev:check`: passed.
- `npm run prepare:deployment`: passed on final code commit.
- `npm run codex:verify`: passed (first restricted attempt hit local Next output EPERM; elevated retry passed; existing autoprefixer warnings).
- `npx tsx --test lib/spn-display-regions.test.ts lib/spn-room-explorer.test.ts`: 8 passed.
- `npm run design:inventory` and `npm run design:check`: passed; generated catalogue committed.
- Browser QA: real reviewer component renders with no page errors; East filter includes 2/5/74; inspector shows dual labels. Real shared room-map component renders parchment fills, gray K/C colors match with distinct accessible labels, selection works. Screenshots under Citra region-colors-qa directory. No physical move controls used.

## Deploy Notes

- Migrations: none.
- Environment variables: none.
- Data/backfill/release steps: none. Static presentation JSON only; no native proposal, canonical tradition, numbering, location or physical-history writes.
- Queue/deploy trigger: ready now.
- Live smoke: current reviewer and companion should show 17/18 gray; 64–68 gray; 37 East; 5 and 74 blue midpoint; 80 West; 27/73 neutral. Toggle East and North to check shared membership. Do not click move confirmation controls.

## Risk And Conflicts

- Shared areas: MuseumRoomPlan, SPN explorer/companion, move page, global CSS, tokens and generated token catalogue, design-system index.
- Expected conflicts: any parallel edits to these components or token catalogue; regenerate inventory after integration if needed.
- Current reviewer overlay is scoped to the first/current release option; archived studies retain their grouping/color source.
- Rollback: standard code rollback; no database rollback.

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
