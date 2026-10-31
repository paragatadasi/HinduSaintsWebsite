# Release Handoff: codex/v1-move-guide

- Status: `ready`
- Branch: `codex/v1-move-guide`
- Commit: `5a534647904c44e8fb702251084199df7167f1f8`
- Owner/agent: Citra
- Bundle priority: immediate candidate after V45; do not delay V45

## Summary

- Add Vitrine 1 alongside V45 in the West row of the companion, using the approved Western v9 BAPS/Gondal/Amreli subset.
- All 19 observations retained: four BAPS, eight Gondal and seven Amreli; 18 linked and one source-only, with possible overlap notes preserved.
- BAPS shelves 1–2, living Mahant Swami shelf 2, geographic groups below remain recommendations. Checking records the vitrine only, never a suggested shelf.
- Includes Nadi f1f0932 and V45 ancestry. Resolved shared registry, physical-validation and documentation merges preserve both guides.

## Verification

- `npm run codex:verify`: passed on final code.
- `npm run prepare:deployment`: passed.
- 34 focused V1, V45, assistant authorization and addition-projection tests: passed.
- Real-component browser fixture: 19 checklist records, Mahant present, availability-only confirmation, single destination with no shelf, V45-to-V1 switching and mobile overflow checks passed. Desktop screenshot reviewed.
- Tests used mock writes only; no production records changed.

## Deploy Notes

- Migrations: none.
- Environment variables: none. Airtable delivery remains disabled.
- Data/backfill: checked guide packet only. No physical placements, canonical links or shelf records created.
- Verify authenticated `/museumadmin/move?phase=west1&vitrine=1` and West navigation with V45 still available.
- The source-only Gondal exception remains curator-only while its global destination differs. Preserve this distinction rather than inventing a canonical link.
- 4.97/5 is a comparison estimate with possible overlaps, not certified fit. Eight Jalaram–Bhoja/Rajkot/Virpur records stay in 60; Brahma Kumaris exact-case pending is unchanged.

## Risk And Conflicts

- Shared areas: move page/navigation, guide registry, physical transaction validation and museum documentation.
- This branch includes V45; integrate after that candidate, not as a backend-only release. No conflict expected after V45 integration.
- Standard code rollback; no data rollback needed.
- Existing museum skills cover these rules; no reusable skill changes were required.

## Release Captain Notes

- Integrated into main: pending.
- Pushed to main: no.
- Merged to deploy: pending.
- Production workflow: pending.
