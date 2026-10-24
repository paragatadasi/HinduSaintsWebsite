# Release Handoff: codex/data-workflow-skill-maintenance

- Status: queued
- Branch: `codex/data-workflow-skill-maintenance`
- Commit: `ea00a8578e0ac23435ab0f146caae895f49ef7e7`
- Owner/agent: `Nadi`
- Bundle priority: queue for next major/bundled deployment

## Summary

- Add the standing instruction to review lessons after each data workflow, maintain relevant skills, and coordinate with Citra and Saarthi as needed.
- Keep changing facts and private records outside skills; validate changed guidance and report changes or a no-change review.

## Verification

- `npm run dev:check`: passed
- `git diff --check`: passed

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none. The two skills are installed locally under the user's Codex skills directory; this commit only documents their maintenance and does not distribute the skill files.
- Queue/deploy trigger: queued until the next requested or major deployment

## Risk And Conflicts

- Shared areas touched: AGENTS.md
- Expected conflicts: possible concurrent AGENTS.md edits. Branch starts from shared root feature commit fed6ba1; cherry-pick only ea00a85 and this handoff commit if unrelated ancestry is not already integrated. Do not include unrelated feature work.
- Rollback notes: revert `ea00a85` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
