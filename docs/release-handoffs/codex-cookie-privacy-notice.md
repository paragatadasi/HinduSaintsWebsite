# Release Handoff: codex/cookie-privacy-notice

- Status: queued
- Branch: `codex/cookie-privacy-notice`
- Commit: `4253a9862a5a1112180edc334659c0004a270418`
- Owner/agent: `aporu`
- Bundle priority: queue for next major/bundled deployment

## Summary

- Adds a dismissible, re-openable cookie and privacy notice that accurately
  describes essential browser storage, protected-admin authentication cookies,
  and cookie-free aggregate application telemetry.
- States that the application does not use advertising or cross-site tracking
  cookies, and treats dismissal as acknowledgement rather than consent.
- Updates the default Bhakti Marga privacy-policy URL and maps the former
  `/privacy-policy` default to the current `/privacy` page.

## Verification

- `npm run dev:check`: passed
- `npm test`: passed (156 tests)
- Live visual preview: not run because the local PostgreSQL container could not
  start while Docker Desktop was unavailable.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none
- Queue/deploy trigger: queued until the next requested or major deployment

## Risk And Conflicts

- Shared areas touched: public footer, site configuration, global design tokens,
  and global CSS
- Expected conflicts: possible in `components/layout/site-footer.tsx`,
  `styles/globals.css`, or `styles/tokens.css` if another queued branch edits the
  same shared presentation areas
- Rollback notes: revert `4253a98` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
