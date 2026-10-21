# Release Handoff: codex/museum-guide-final-expansion

- Status: ready
- Branch: `codex/museum-guide-final-expansion`
- Commit: `740be4cf9f81b12653a21a2f6658ccc71bf62da9`
- Owner/agent: `Citra`
- Bundle priority: immediate release candidate

## Summary

- Activate final approved guide v10: 71 typed research connections in 20 groups, preserving all original 63 IDs and semantics.

## Verification

- dev:check passed; 15 domain/adapter tests passed including original63 compatibility, all71 graph claims, context identity and blank-destination drift; local synthetic browser verified 20 groups, 71 report link, traditional Sai manifestation and context-only Papa Ramdas mantra initiation; git diff --check passed. Release captain owns integrated codex:verify.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: Read-only catalogue update. No schema, migrations, env or data writes. Guide dated baseline 2026-10-21T04:11:24.309Z revision ba436e205bbd69f4ca9bfd75f9f4ab649cbafe24242c0d8217e420bc82586e28; Nadi current saved destinations remain authoritative. All identity holds preserved. After confirmed runtime rollout, Nadi should export 71 dispositions and verify representative private views.
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: Private guide v10 manifest, domain manifest selection and blank-vitrine drift guard, regression tests and documentation.
- Expected conflicts: Depends on paired guide UI already integrated into main. Runtime promotion for prior release remains unverified; dispatch success is not production proof. New guide file is a dated snapshot; later destination-only refresh may update notes without changing stable IDs or relationship semantics.
- Rollback notes: revert `740be4c` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
