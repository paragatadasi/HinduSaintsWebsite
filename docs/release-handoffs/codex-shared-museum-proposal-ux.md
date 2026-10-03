# Release Handoff: codex/shared-museum-proposal-ux

- Status: ready
- Branch: `codex/shared-museum-proposal-ux`
- Commit: `cb7d08ca2a637970cf0592e9398408b83561c5b3`
- Owner/agent: `aporu`
- Bundle priority: immediate release candidate

## Summary

- SPN and Vrindavan now share MuseumProposalOverview and MuseumSectionWorkspace: overview metrics/search/thematic sequence, grouped families and primary/secondary/tertiary saints, research/location controls and saint dialogs.
- Preserve Vrindavan query URLs, empty sections and museum-specific mutation adapters. SPN-only bridge evidence/tree exports are not presented as Vrindavan evidence.
- Document shared architecture and limitations in design-system and museum-data-integration docs.

## Verification

- `npm run prepare:deployment`: passed.
- `npm run codex:verify`: passed.
- Focused museum working-view, Vrindavan section-view and working-domain tests: 15 passed.
- Local synthetic fixture visual checks passed: desktop overview/section, saint dialog, mobile section/dialog at 390px; no horizontal document overflow. Fixture and preview server removed/stopped. This was layout validation, not production data or authenticated write testing.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none for this slice; ensure preceding Vrindavan editing migration has been released. Thematic sequence is suggested, not a confirmed physical layout.
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: SPN overview, promoted shared section workspace, Vrindavan section page, docs. No CSS, schema, auth or mutation changes.
- Expected conflicts: preserve concurrent museum documentation additions. Depends on Vrindavan editing 65510af, included in ancestry.
- Rollback notes: revert `cb7d08c` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
