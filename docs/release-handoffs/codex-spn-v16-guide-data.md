# Release Handoff: codex/spn-v16-guide-data

- Status: ready
- Branch: `codex/spn-v16-guide-data`
- Commit: `7ee5e6ae5f14123caca086771d5ef593224b216c`
- Owner/agent: `Nadi`
- Bundle priority: immediate release candidate

## Summary

- Activate audited SPN v16 with aligned immutable starter guide v3
- Preserve curator decisions and confirmed placements; enforce mixed-object housing holds

## Verification

- npm run dev:check passed; 18 focused tests passed. Production build is owned by Mira using the real release dependency install.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: No database writes or backfill. Deploy proposal and guide together. Existing 23 placement receipts remain unchanged.
- Queue/deploy trigger: ready now
- Activation approval: Paragata Dasi answered "Yes, activate v16" in Citra's chat on 28 October 2026, explicitly covering planner, guide and rebuilt explorer while preserving edits and actuals.
- Expected proposal: `spn-highlighted-anchor-city-refinement-2026-10-27-v16`; expected guide: `spn-starter-move-guide-handoff-2026-10-28-v3`.
- Smoke checks: 135 starter sources, four outgoing transition sources, existing 23 placement receipts still recognized, and no executable reference-only alternatives. Newer curator destinations must remain visible.

## Risk And Conflicts

- Shared areas touched: SPN proposal baseline, guide registry, move confirmation services and Citra companion
- Expected conflicts: Includes Citra UI commits through 4fc3f30; integrate remaining Citra handoff without duplicate cherry-picks
- Rollback notes: roll back the coherent v16 backend/data and companion release together. Do not revert only the default-proposal switch, which would leave a v3/v10 mismatch. Preserve all physical-location and decision records; no database rollback or deletion is required.
- Dependency install: this feature checkout uses a junction for development checks only. Use the release captain's real dependency installation for production-build verification.

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
