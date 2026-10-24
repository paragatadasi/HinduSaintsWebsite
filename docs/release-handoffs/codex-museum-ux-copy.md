# Release Handoff: codex/museum-ux-copy

- Status: ready
- Branch: `codex/museum-ux-copy`
- Commit: `95d6554f058e0ed1cd43759ded4f829cc9b1b905`
- Owner/agent: Citra
- Bundle priority: immediate release candidate

## Summary

- Apply approved contextual copy pilot to identity review, proposal editing and move confirmations.
- Remove redundant Museum Admin instructions, disclose occasional diagram help, and remove stale move-recording copy.
- Add contextual UX copy rules to AGENTS and coverage in docs/museum-ux-copy-review.md.

## Verification

- `npm run prepare:deployment`: passed (includes dev:check and handoff generation).
- 36 existing curator-review, move-planner, arrangement and section-destination tests passed.
- Browser fixture rendered actual components with sample data/mocked actions: help disclosure, identity acknowledgement guard, uncertain-save lock/reload, exact and flexible completion forms. No production database mutations.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: Museum Admin proposal, review, arrangement, membership, tree and planning components; AGENTS.md. No styling changes.
- Expected conflicts: preserve Nadi’s separately queued Data workflow learning section in AGENTS (codex/data-workflow-skill-maintenance, ea00a85). This branch adds UX copy instructions before Security; do not replace the entire file.
- Base includes integrated map-first SPN code 6395de0. Integrate copy code 95d6554 plus this handoff; no need to repeat the layout change.
- Low-risk copy/disclosure update. Save guards, server actions, statuses and required inputs unchanged. Legacy SPN proposal-confirmation terminology retained pending any separate workflow decision.
- Rollback notes: revert `95d6554` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
