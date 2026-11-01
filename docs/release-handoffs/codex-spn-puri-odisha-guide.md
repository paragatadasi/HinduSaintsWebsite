# Release Handoff: codex/spn-puri-odisha-guide

- Status: ready
- Branch: `codex/spn-puri-odisha-guide`
- Commit: `6e941dafd528bef3408f4da83bb2040ed7ea4225`
- Owner/agent: `Citra`
- Bundle priority: immediate release candidate

## Summary

- Load approved Puri/Odisha stories and 37 records for V25/V26; preserve V24 and defer new shelf recommendations.
- Allow only the recorded Pagal Baba non-stick V19 component to be proposed/confirmed in V25, with scoped undo and assistant support.

## Verification

- dev:check passed; full npm test 914 passed/1 existing skip; final scoped tests 10 passed; actual starter cross-guide tests 4 passed; codex:verify passed (Windows folder access elevation).

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: Nadi verified 36/37 native destinations (21 changed,15 already correct). Pagal whole-source native26 remains unchanged; exact component receipt permits scoped25 action. No physical moves, migration, or automatic backfill. Gopal Das remains a user manual change.
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: Guide registry/projection, physical component audit reader and confirmation, companion additions/search, reviewer headlines, shelf reader.
- Expected conflicts: Coordinate any concurrent museum physical-location changes. Do not bundle V17/70/23 changes. After scoped confirmations exist, prefer forward fixes or preserve the new receipt reader on rollback.
- Rollback notes: revert `6e941da` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending

## Evidence and scoped behavior

- Frozen packet: data/museum/spn-puri-odisha-approved-v4.json. V25 has17 observations; V26 has20, including two context-only deity records without move controls. No canonical tiers or identities changed. Durgaprasad footprint stays unknown; all object/identity holds remain.
- Pagal scope binds source rec7GxgNvmubmTvMM, canonical/source revision and staging receipt cmvwko6oa000l07qz8em2nfuh, origin19, non-stick contents only, target25. The excluded sticks remain unverified/unlocated. Separate source recWXZzMbejtZgyBH in31 is not linked or changed.
- Component completion is labelled non-stick; undo returns its staged record and advances revision to reject stale pre-move requests. Whole-source location remains unknown. No production confirmation was performed for QA.
- After release Nadi may verify the scoped proposal path; saving a proposal must not imply physical confirmation.
- Local museum-data-interpretation skill updated with the tested move/undo revision rule. Existing interpretation rules otherwise unchanged. Standard skill validator could not run because PyYAML is absent; frontmatter was unchanged and the new rule was manually checked against the regression tests.
