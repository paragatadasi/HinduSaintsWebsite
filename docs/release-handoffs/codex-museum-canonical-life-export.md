# Release Handoff: codex/museum-canonical-life-export

- Status: ready
- Branch: `codex/museum-canonical-life-export`
- Commit: `0c3d847ab1b988c328a5e6c38f64bf85067c7f58`
- Owner/agent: `Nadi`
- Bundle priority: immediate release candidate

## Summary

- Include current canonical birth/samadhi raw text and numeric years in the protected SPN audit snapshot, keyed by canonical saint ID. This enables a read-only comparison of source living claims with the fields used by the operational guide.
- Document the additive export contract. No date, proposal or physical placement writes.

## Verification

- `npm run dev:check`: passed
- `npm run prepare:deployment`: passed
- `git diff --check`: passed

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: no backfill. After promotion, download a fresh protected SPN tier snapshot and compare canonicalLifeEvidence with source assertions before claiming that the living-status audit is complete.
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: lib/spn-tier-audit.ts; docs/museum-companion-life-status.md
- Expected conflicts: additive export fields; coordinate with Citra's Northern shelf UI. Compatible with a combined release or an export-only release for the audit.
- Rollback notes: revert `0c3d847` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
