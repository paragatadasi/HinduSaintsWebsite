# Release Handoff: codex/museum-neighbourhood-learning

- Status: queued
- Branch: `codex/museum-neighbourhood-learning`
- Commit: `275fc61`
- Owner/agent: `Nadi`
- Bundle priority: queue for next major/bundled deployment

## Summary

- Restore previously approved museum planning principles and integrate the neighbourhood refinement procedure; no application or data changes.

- Follow-up: check preserved source Master/Disciple claims separately from canonical edges; keep imported claims attributed until identities and type are verified.

## Verification

- Markdown local links passed; git diff whitespace check passed; official planner skill validator passed; representative and counterexample review recorded privately. Runtime checks not applicable to prose-only change.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: Documentation only. No proposals, physical locations, historical relationships or guide versions changed. Local planner skill and reference updated and validated separately.
- Queue/deploy trigger: queued until the next requested or major deployment

## Risk And Conflicts

- Shared areas touched: docs/museum-planning-principles.md
- Expected conflicts: Supersedes the planning-principles document portion of historical codex/museum-planning-refinement-docs 4f86c02 / queued bc88083; do not integrate unrelated old branch code.
- Rollback notes: revert `40797e7` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
