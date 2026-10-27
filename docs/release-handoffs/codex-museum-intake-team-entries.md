# Release Handoff: codex/museum-intake-team-entries

- Status: ready
- Branch: `codex/museum-intake-team-entries`
- Commit: `57a9d6a403ceeef582817370309b779ade2dd4e4`
- Owner/agent: `Citra`
- Bundle priority: immediate release candidate

## Summary

- Museum assistants can edit museum-scoped team drafts and submissions, with My entries and Team entries views.
- Optional relic-specific place is explicit and never inherited; existing photos and records preserved.

## Verification

- codex:verify PASS (clean elevated Windows rerun); dev:check PASS; 14 focused tests PASS; fresh disposable DB team/migration/media/access verifier PASS; browser teammate submitted correction/resubmit, mine/team separation, persisted place and two retained photos PASS.

## Deploy Notes

- Migrations: 20261027220000_museum_intake_team: additive membership table and authorized existing-assistant SPN backfill.
- Environment variables: None. Keep Airtable and website delivery disabled.
- Data/backfill/release steps: All current Museum Assistant accounts join active SPN only. Future accounts require explicit site-admin assignment. No existing intake, media, approvals or deliveries rewritten.
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: Intake UI/service/schema; site-admin users/local accounts; account route uses existing [id] segment.
- Expected conflicts: Bundle with current SPN proposal via Mira. Exclude unfinished room move companion. Run migration in release phase. Data workflow review found no reusable interpretation changes.
- Rollback notes: revert `57a9d6a` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
