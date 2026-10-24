# Release Handoff: codex/museum-planning-principles

- Status: queued
- Branch: `codex/museum-planning-principles`
- Commit: `116d356c545c556e0677004dc4ee59d13d14f604`
- Owner/agent: `Nadi`
- Bundle priority: queue for next major/bundled deployment

## Summary

- Add shared SPN/Vrindavan museum planning principles and AGENTS skill routing, linked from existing museum planning contracts.

## Verification

- Reviewed against museum evidence, identity, family reconciliation, scoped region, move-guide and layout contracts; relative Markdown links resolve; git diff --check passed. Docs only: no runtime tests required.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: Documentation only; no proposal load, identities, tiers, placements, saved plans or physical confirmations change. Saarthi owns local museum-planner skill installation/validation.
- Queue/deploy trigger: queued until the next requested or major deployment

## Risk And Conflicts

- Shared areas touched: AGENTS.md; docs/museum-planning-principles.md; docs/museum-suggested-plan.md; docs/spn-museum-layout.md
- Expected conflicts: Possible one-line AGENTS overlap with concurrent instructions; preserve both scoped guidance changes. Independent of current proposal UI release.
- Rollback notes: revert `116d356` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
