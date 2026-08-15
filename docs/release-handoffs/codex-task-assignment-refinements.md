# Release Handoff: codex/task-assignment-refinements

- Status: `queued`
- Branch: `codex/task-assignment-refinements`
- Commit: `28c0a950a8204d25bbf75a8da7ebcc1d02cdf4b6`
- Owner/agent: `/root`
- Bundle priority: `queue for next major/bundled deployment`

## Summary

- Limits fact-checkers to one assigned or in-progress task at a time while allowing another claim when their existing tasks are blocked or completed.
- Preserves task status, blocking reason, notes, and content edits when an assignee leaves; moves the secondary Leave task action into the relevant assignee card.
- Removes the cancelled assignment state, removes the dashboard Available tab, stabilizes expanded task-card alignment, and makes Update primary only when a valid change can be submitted.

## Verification

- `npm run dev:check`: `passed`
- `npm test`: `passed (160/160)`
- `git diff --check`: `passed`
- `npm run codex:verify`: `passed`

## Deploy Notes

- Migrations: `20260815120000_remove_cancelled_assignment_state` converts legacy cancelled assignments to completed, preserves the rows, fills missing completed timestamps from updated timestamps, and removes cancelled from the PostgreSQL enum.
- Environment variables: `none`
- Data/backfill/release steps: `run the normal production migration/release phase before starting the updated application`
- Queue/deploy trigger: `queued until the next requested/major deployment`

## Risk And Conflicts

- Shared areas touched: `assignment actions and components, permissions, dashboard routing, global admin styles, Prisma AssignmentState enum`
- Expected conflicts: `possible overlap with concurrent assignment/dashboard/global-style work`
- Rollback notes: `application rollback is standard; database rollback requires recreating the cancelled enum value if older application code still references it`

## Release Captain Notes

- Integrated into `main`: `pending`
- Pushed to `main`: `no`
- Merged to `deploy`: `pending`
- Production workflow: `unavailable`
