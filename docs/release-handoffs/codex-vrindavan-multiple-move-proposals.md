# Release Handoff: codex/vrindavan-multiple-move-proposals

- Status: ready
- Branch: `codex/vrindavan-multiple-move-proposals`
- Commit: `1d4d602320de05bd8459caa001bb7aa2452a3cc4`
- Owner/agent: `Citra`
- Bundle priority: immediate release candidate

## Summary

- Preserve multiple named Vrindavan move proposals with explicit preview/activation and outgoing snapshot preservation.
- Add reviewed five-box, seven-step short-visit plan without automatically activating it; retain full long-term proposal.

## Verification

- 29 unit tests passed; disposable PostgreSQL lifecycle and stale-source/tier/family guards passed; dev:check passed; elevated codex:verify passed; local browser preview and companion verified.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: No migrations or automatic production writes. Nadi to register through Preview after deployment, verify preserved full snapshot and physical/source guards; curator alone chooses Use this proposal. Five-box core remains separate from additional family-first research.
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: Vrindavan plan actions/page; shared museum planner, companion, search and room-map components; new private audit-backed variant service.
- Expected conflicts: Built from main 8eda1e9. Preserve any subsequent shared planner changes during integration. No environment changes. Check actual slot fit before physical moves; entry counts are not measured capacity.
- Rollback notes: revert `1d4d602` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
