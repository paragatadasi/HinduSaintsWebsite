# Release Handoff: codex/airtable-job-draft-actions

- Status: ready
- Branch: `codex/airtable-job-draft-actions`
- Commit: `86de6aeeacae2644f36108600d357ab406469468`
- Owner/agent: `Airtable Data Sync`
- Bundle priority: immediate release candidate

## Summary

- Add View imported drafts to missing-draft and slug-repair job history; expose existing permission-gated archive and password-protected bulk removal controls.
- Use legacy slug-repair evidence plus timestamp candidates; persist job and original created-saint attribution for future successfully linked imports, protecting retained saints after merges.
- Clarify backup discovery, restore testing, and archive-first recovery in deployment/recovery documentation.

## Verification

- `npm run dev:check`: passed
- `npm run prepare:deployment`: passed
- `npm test`: passed (243 passed, 1 skipped)
- `npm run codex:verify`: passed (production build, all 18 static pages and trace collection)

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none automatically. No production records changed. Old runs remain candidate lists; partial failed rows may lack attribution. Confirm production backup recovery separately before deletion. Archive preserves source linkage; Remove clears linkage and may allow recreation on a later import.
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: lib/airtable-saint-import.ts; app/admin/airtable/airtable-import-panel.tsx; app/admin/saints/imported/page.tsx; docs/deployment.md; docs/airtable-import-duplicate-recovery.md; new lib/airtable-import-draft-review helper and tests. No schema, dependency, environment, or auth configuration changes.
- Expected conflicts: coordinate concurrent Airtable import/review and deployment-documentation edits. UI reuses existing bulk action authorization/password checks.
- Rollback notes: revert `86de6ae` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
