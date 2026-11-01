# Release Handoff: codex/spn-clear-acknowledgement

- Status: `ready`
- Branch: `codex/spn-clear-acknowledgement`
- Commit: `61e6aea922955ac950a3cd8e6313744c17777c52`
- Owner/agent: Citra
- Bundle priority: bundle partial-clearing UI/backend and Gujarat59 correction

## Summary

- Partial clearing: exact selected eligible entries to staging; separate space-available acknowledgement permits incoming placements without claiming the case is empty. Unselected and confirmed target placements stay unchanged. Full clearing remains available in a secondary disclosure.
- Inline errors and idempotent retries preserve selected entries. Live availability updates invalidate readiness when contents change. Nadi backend code 5e47a43 and performance followup429b66c are already cherry-picked as9ed660a andd593b12; do not duplicate them.
- Fix missing initial clearing acknowledgement and put clearing save feedback beside its button. West40–44 and Junagadh clearance is per destination.
- Numbered cases47/59 physically swapped with old contents. Geometry follows those cases; approved19 Gujarat proposals now receive into59, with successor guide. Historical47guide read-only. No numeric physical-origin remapping.

## Verification

- Combined `npm run dev:check`: passed.
- Combined `npm test`: 890 passed, 1 skipped.
- `npm run prepare:deployment`: passed before backend integration; final combined `npm run codex:verify` passed (elevated retry after Windows EPERM on build folder).
- No production clearing or placement executed for testing.

## Deploy Notes

- Migrations: none.
- Environment variables: none.
- Native Gujarat19 proposal update47→59 completed separately by Nadi, readback confirmed; all physical states preserved.
- Entire partial-clearing UI and backend must ship together.
- No17/70/23 physical or proposal correction in this branch; that audited chronology is separate. No43/44 proposal swap in this branch.
- No reusable skill interpretation change found; workflow contract documented in repository.

## Risk And Conflicts

- Shared areas: physical-location service and progress API, receiver registry, companion, reviewer layout, guide packets.
- Nadi partial-clearing branch is incorporated; release captain should avoid duplicate cherry-picks. Performance followup429b66c is included. Absorb Nadi queued handoff a8a559b rather than integrating backend code twice.
- Existing component/fixed/identity holds remain; partial selection does not bypass them.
- Rollback must retain saved availability audit records and all physical moves. Previous UI cannot express partial readiness; do not roll back backend alone while new UI remains.

## Release Captain Notes

- Integration: ready; captain owns main/deploy and production confirmation.
