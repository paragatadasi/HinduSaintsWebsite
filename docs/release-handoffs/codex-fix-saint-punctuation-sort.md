# Release Handoff: codex/fix-saint-punctuation-sort

- Status: ready
- Branch: `codex/fix-saint-punctuation-sort`
- Commit: `fa75c00ee13661e22aa5c88e7c9eb585e20017d8`
- Owner/agent: `aporu`

## Summary

- Normalize punctuation out of shared saint alphabetization keys without joining adjacent words.
- Ignore a leading parenthetical alias after an ignored honorific, placing Sri (Ishwar) Tota Puri Baba under T instead of before A.
- Add regression coverage for initials, apostrophes, hyphens, parentheses, Unicode dashes, and comparative ordering.

## Verification

- `npm run dev:check`: passed
- `npm test`: passed (87 tests)
- Audited 1,395 unique imported saint names: four intended parenthetical corrections, two intended punctuation-only relative-order changes, and zero new comparator-equivalence collisions.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none

## Risk And Conflicts

- Shared areas touched: `lib/saint-name-sort.ts`, used by the saint catalog, search tie-breaking, place and tradition saint lists, and the India saints map.
- Expected conflicts: none
- Rollback notes: revert `fa75c00` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
