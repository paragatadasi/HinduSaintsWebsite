# Release Handoff: codex/vrindavan-section-data

- Status: `ready`
- Branch: `codex/vrindavan-section-data`
- Commit: `1447372`
- Owner/agent: Museum Data Integration
- Bundle priority: next data checkpoint after Vrindavan curator pilot

## Summary

- Private readVrindavanSectionProposalAudit projects SPN section/tier/confidence/alternatives/rationale as Vrindavan Proposed candidates for confirmed canonical saints. Shared spiritual regions and website primary places remain canonical; SPN acceptance/group/location data is not copied as Vrindavan operational state.
- Compares source place text against website locality names/aliases and flags unmatched geography and geographic section candidates for research. Does not silently change either museum or saint geography.
- Protected /admin/source-data/museum/vrindavan/section-audit downloads a live current confirmed-identity JSON report; noindex, no-store. No UI changes.

## Verification

- Five focused museum-place-comparison tests passed.
- npm run codex:verify passed (production build).
- npm run prepare:deployment passed.
- Preliminary read-only workspace DB/source comparison produced private report; workspace DB is July baseline, not live278 production audit. No external data committed.

## Deploy Notes

- Migrations/environment/dependencies: none.
- Data/backfill: none. Projection only; no source, section, saint place, publication or physical inventory mutations.
- Deploy order: ship existing Vrindavan curator UI pilot first, then this separate requested phase. The UX chat has been notified of reader contract and report destination.
- After deployment, authenticated museum/full-catalogue users can download the live audit. Production corrections require current report and research; preliminary mismatches are not approved errors.

## Risk And Conflicts

- Shared areas: appended docs/museum-data-integration.md; isolated new reader/domain/test and protected report route.
- Uses current SPN working data and museum-vrindavan confirmed source projection. Conflicting/missing SPN proposals remain reviewable. No exhibit membership ID inheritance.
- Raw source geography may describe collection locations or incorrect identity; differences cannot auto-adjust shared places or reviewed sections.
- Rollback: normal code rollback, no data writes.

## Release Captain Notes

- Notify Museum Data Integration thread 01a0f25f-fc6a-7fd2-a3f8-cd78f289cc5e when deployed.
- Integrated main: pending
- Pushed main: no
- Merged deploy: pending
- Production workflow: pending