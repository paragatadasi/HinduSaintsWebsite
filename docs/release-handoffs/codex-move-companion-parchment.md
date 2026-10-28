# Release Handoff: codex/move-companion-parchment

- Status: ready
- Branch: `codex/move-companion-parchment`
- Commit: `a9ee2ac0c30d14e40c7cc4e5c422faa03ae3e8af`
- Owner/agent: `aporu`
- Bundle priority: immediate release candidate

## Summary

- Compact parchment starter-row guide: expanded map beside guide, family member dialogs, families then city groups then exhaustive tiered checklist. All placement controls share persisted physical state. Compact defer/decline chips and restore. Malformed save responses show a recoverable error.

## Verification

- `npm run dev:check`: passed

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: none
- Expected conflicts: none
- Rollback notes: revert `a9ee2ac` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending

## Verified scope

- Owner: Citra. User explicitly requests starter-row deployment first; Datta later.
- npm run prepare:deployment passed; design:check passed; 9 guide/registry tests passed.
- Local actual-component browser fixture: desktop/mobile no page overflow; tree modal opens and Escape closes; simulated placement synchronizes duplicate checkboxes and reload; this fixture does not write production.
- No schema, migration, environment, proposal assignment or physical-data changes. Airtable delivery remains disabled.
- Shared styles/tokens and generated catalogue changed. Keep main's newer live-tier projection and concept labels. Branch based on c05fb5b; no route edits. Regenerate token inventory if integration changes it.
- Do NOT include codex/spn-datta-guide-contract in this starter release. No Datta activation. Future phase props are inert defaults.
- Review private hosting deployment completion separately from public dispatch workflow; do not claim live based on dispatch alone.
