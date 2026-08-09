# Release Handoff: codex/reduce-saint-prefetch

- Status: queued
- Branch: `codex/reduce-saint-prefetch`
- Commit: `2f06a8ed5472aa54f69f43e72c2067a866de5bef`
- Owner/agent: `aporu`
- Bundle priority: queue for next major/bundled deployment

## Summary

- Disable automatic Next.js prefetching for the global public navigation and saint-profile taxonomy links.
- Add per-card prefetch control and disable background route prefetching for related-saint cards.
- Reduce unused dynamic RSC, database, and network work on relationship-heavy saint profiles without changing their visible content or layout.

## Verification

- `npm run dev:check`: passed

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none; responsive media/object-storage migration remains separate from this code-only change
- Queue/deploy trigger: queued until the next requested or major deployment

## Risk And Conflicts

- Shared areas touched: public site header, `SaintCard`, `TaxonomyLinkList`, and the saint detail route
- Expected conflicts: low; the branch was synchronized with `main` at `9335f57`, including the current saint duplicate redirect handling
- Behavioral risk: navigation and related/taxonomy links now fetch on click instead of speculatively, so a deliberate first click may wait for the dynamic response
- Rollback notes: revert feature commit `3f5f2d3` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
