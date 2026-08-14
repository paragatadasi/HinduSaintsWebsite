# Release Handoff: codex/saint-sources-reading

- Status: queued
- Branch: `codex/saint-sources-reading`
- Commit: `3a7500d9a1fde762932dc64a3ecd622a2bb881c1`
- Owner/agent: `root`
- Bundle priority: queue for next major/bundled deployment

## Summary

- Redesigns public saint Sources & Further Reading with shared theme tokens, readable titles, descriptions, and accessible external links.
- Adds a fact-checker-editable Sources tab and decouples source management from biography revisions while retaining citation support.
- Normalizes imported URL-only source titles and preserves current sources in narrative previews.

## Verification

- npm run codex:verify: passed in the persistent release-verification worktree; npm test: 156/156 passed

## Deploy Notes

- Migrations: Apply prisma/migrations/20260814120000_content_source_description during the deployment migrate/release phase; it adds ContentSource.description and backfills existing Source.notes.
- Environment variables: none
- Data/backfill/release steps: Run the migration in the release phase; no manual backfill is required beyond the migration SQL.
- Queue/deploy trigger: queued until the next requested or major deployment

## Risk And Conflicts

- Shared areas touched: prisma/schema.prisma, styles/tokens.css, styles/globals.css, saint admin actions/editor, public saint detail component, editorial revision schemas/previews
- Expected conflicts: Watch for changes to components/saints/saint-detail-page.tsx or the saint editorial-revision flow; this branch was integrated onto origin/main at 547a0a8.
- Rollback notes: revert `3a7500d` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
