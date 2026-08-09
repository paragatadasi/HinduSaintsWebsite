# Release Handoff: codex/admin-duplicate-merge

- Status: ready
- Branch: `codex/admin-duplicate-merge`
- Commit: `6b566507f0b0e9c17ac6e8d9ddec9a97c6e3faef`
- Owner/agent: `aporu`
- Bundle priority: immediate release candidate

## Summary

- Adds a dedicated conflict-review screen for confirmed Saint duplicates, with an explicit survivor choice and per-field resolution instead of a crowded destructive action in the reconciliation card.
- Adds a password-protected, Site-Admin-only final merge action that rechecks the confirmed pair and transfers or consolidates every known Saint relationship inside one serializable transaction.
- Preserves aliases, biographies, media, places, traditions, lineage, Saint relationships and evidence, family and private Museum assignments, Instagram data, homepage references, source/import links, assignments, reconciliation data, and feedback references; stale drafts, edit conflicts, and presence rows are cleared deliberately.
- Adds durable retired-slug redirects for public and admin Saint URLs, with public resolution limited to published survivors, plus a detailed merge audit event and hardening documentation.

## Verification

- `npm run prepare:deployment`: passed
- `npm test`: passed (129/129)
- `npm run codex:verify`: compiled, type-checked, collected page data, and generated all 16 static pages; the first run then hit the known Windows worktree junction EPERM during trace copy, and the isolated-dependency rerun reached trace collection before the 300-second command limit with only existing Autoprefixer warnings
- `git diff --check`: passed before the feature commit
- Authenticated browser rendering was unavailable because this machine has no running local PostgreSQL service or authenticated local admin session; the merge UI was reviewed against the repository's design-system and responsive review-workflow contracts

## Deploy Notes

- Migrations: `20260811100000_saint_slug_redirects`
- Environment variables: none
- Data/backfill/release steps: no backfill or manual steps; run the migration in the normal deployment migrate phase before the new application starts
- Queue/deploy trigger: ready now

## Risk And Conflicts

- Shared areas touched: Prisma schema/migrations, public and admin Saint slug resolution, reconciliation queue and actions, shared admin review styles, public Saint data access, workflow/data-model documentation
- Expected conflicts: integrate carefully with branches changing Saint relations, reconciliation, public Saint lookup, `styles/globals.css`, or Prisma schema/migrations
- Risk notes: this is a destructive transaction behind `merge_saints`, `manage_sensitive_actions`, the sensitive-action password, a confirmed candidate check, and an explicit acknowledgement; the release captain should run the full integrated production verification and migration review
- Rollback notes: revert `6b56650` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
