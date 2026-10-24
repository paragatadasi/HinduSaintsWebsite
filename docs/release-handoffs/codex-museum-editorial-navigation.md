# Release Handoff: codex/museum-editorial-navigation

- Status: ready
- Branch: `codex/museum-editorial-navigation`
- Commit: `1d76a164e6945c92aedbee20fdb7a867226c63bf`
- Owner/agent: `Citra`
- Bundle priority: immediate release candidate

## Summary

- Shared editorial navigation for SPN and Vrindavan: native museum selector, gold-underlined serif headings, 13px subsection links, compact persistent regional disclosures, colored regional cues and quiet utility links. Removes duplicate museum identity from signed-in sidebar; sign-in identity stays unchanged.

## Verification

- `npm run prepare:deployment` / `dev:check`: passed.
- Browser fixture uses production component: both museum routes, Vrindavan query-based selection, expanded state through navigation, computed 13px subsections, 44px targets, 390px fit, no console errors.
- Existing navigation tests: 3 pass, 1 unchanged baseline failure (expected last South section Andhra; catalogue now ends Kerala). Verified catalogue, grouping logic and test files identical to origin/main; no data/order change in this branch.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: navigation/disclosure/workspace components, shared globals/tokens, design-system docs.
- Expected conflicts: none known; please preserve other concurrent shared-style changes. Known baseline test mismatch above needs release-captain disposition.
- Rollback notes: revert `1d76a16` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
