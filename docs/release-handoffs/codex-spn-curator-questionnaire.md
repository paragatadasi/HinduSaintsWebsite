# Release Handoff: codex/spn-curator-questionnaire

- Status: ready
- Branch: `codex/spn-curator-questionnaire`
- Commit: `49130dd2e6a8cd63f3dc165d7da0fd933d86fc0f`
- Owner/agent: `Citra`
- Bundle priority: immediate release candidate

## Summary

- SPN curator questionnaire with evidence-only answers, durable history and guarded saves
- Single vertical portrait contents beside the SPN map, responsive stacking and published portraits only

## Verification

- dev:check passed; isolated PostgreSQL integration passed; browser desktop/mobile passed; codex:verify exit 0 with Windows EPERM trace-copy warning. Regression 26/27: unchanged Vrindavan South ordering assertion mismatch requires release captain review.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: No production data operation; answers append museum-scoped AuditEvent entries when curators save
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: SPN plan page/actions, location reader, shared museum components, styles/globals.css and tokens.css
- Expected conflicts: Includes queued codex/spn-map-navigation-refinements; supersedes its always-stacked contents rules. Public design docs branch should not overlap.
- Rollback notes: revert `49130dd` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
