# Release Handoff: codex/seo-metadata

- Status: ready
- Branch: `codex/seo-metadata`
- Commit: `30b81515a75f3f648a0e52725c52b51c56b0de22`
- Owner/agent: `aporu`

## Summary

- Add canonical, Open Graph, Twitter, directory, tradition, and place metadata with CMS-first public-data fallbacks.
- Add published-content sitemap and crawler rules, and mark filtered directory URLs and missing records as noindex.

## Verification

- `npm run dev:check`: passed

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none

## Risk And Conflicts

- Shared areas touched: root metadata, public route metadata, `lib/seo.ts`, crawler routes
- Expected conflicts: possible overlap with branches changing social previews or metadata on the same public routes
- Rollback notes: revert `30b8151` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
