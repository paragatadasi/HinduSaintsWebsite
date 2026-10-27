# Release Handoff: codex/intake-relic-document-hotfix

- Status: deployed
- Branch: `codex/intake-relic-document-hotfix`
- Commit: `7ca6ee9298190d85153b81cd63983a0366be08ea`
- Owner/agent: `Nadi`
- Bundle priority: immediate release candidate

## Summary

- Repair relic-specific document uploads rejected by the database media-kind constraint.

## Verification

- dev:check passed; 8 intake domain tests passed; fresh disposable database reproduced failure then passed real document upload/read/retry/submit and preservation; codex:verify passed (normal filesystem retry after Windows EPERM).

## Deploy Notes

- Migrations: 20261027230000_museum_intake_relic_document: expand existing media-kind check; run in release migration phase only.
- Environment variables: none
- Data/backfill/release steps: No backfill or manual production SQL. Existing media, fields and approvals retained.
- Queue/deploy trigger: deployed

## Risk And Conflicts

- Shared areas touched: MuseumIntakeMedia SQL constraint; isolated integration verifier; intake documentation.
- Expected conflicts: none
- Rollback notes: retain the expanded database constraint once relic documents have been saved; do not delete documents or tighten the check. Application rollback does not require reversing this constraint.

## Release Captain Notes

- Integrated into `main`: `d6b4406`
- Pushed to `main`: yes
- Merged to `deploy`: `187f2f8`
- Production workflow: [40541046517](https://github.com/paragatadasi/HinduSaintsWebsite/actions/runs/40541046517) — success

