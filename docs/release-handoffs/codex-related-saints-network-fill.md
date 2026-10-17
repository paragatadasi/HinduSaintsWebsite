# Release Handoff: codex/related-saints-network-fill

- Status: ready
- Branch: `codex/related-saints-network-fill`
- Commit: `61f6a6ad61e4f05d558d30c3a9fd5c988f16601d`
- Owner/agent: `Save imported carousel text`
- Bundle priority: immediate release candidate

## Summary

- Extend published related-saint traversal until eight candidates are found or the reachable network is exhausted; fixes Pant Maharaj missing Dattatreya's other incarnation branches at step four.

## Verification

- Four regression tests passed; dev:check passed; codex:verify passed. prepare:deployment checks passed but handoff argument forwarding failed; generated handoff directly. Live database/browser confirmation not performed.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: User authorizes release captain to deploy this change with all accumulated compatible queued changes; scan the entire queue. No new migration here; inherited carousel migration must precede updated app startup. Smoke-test Pant Maharaj related saints; invalidate saints cache if needed.
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: lib/public-saints.ts and new related-saint-network helper/tests.
- Expected conflicts: Stacked on codex/relationship-editor-status and codex/biography-carousel-reference; integrate ancestors first if not already included.
- Rollback notes: revert `61f6a6a` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
