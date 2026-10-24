# Release Handoff: codex/public-design-system

- Status: queued
- Branch: `codex/public-design-system`
- Commit: `3bea1ae9b386cbd4cfe4cca38e57f9cfd5ab5908`
- Owner/agent: Public Experience Designer
- Bundle priority: queue for next major/bundled deployment

## Summary

- Add Site → Public Design System, with authenticated/noindex component specimens in an isolated public-style preview frame. Both /admin/site/design-system and /design-system-preview require manage_site.
- Add the typed public component registry, curated fixtures, generated token catalogue, drift check, and inventory coverage checks.
- Centralize design guidance through docs/design-system.md, preserve existing guidance in topic files, and reference the index/registry/showcase in AGENTS.md.
- Document integrated panel-header chevrons with accessible disclosure semantics; preserve curator directions for the museum sidebar. No museum component changes.
- Exclude the private specimen preview from public page-view and engagement analytics.

## Verification

- `npm run dev:check`: passed
- `npm run queue:deployment`: passed
- `npm run design:check`: passed (424 declarations)
- `npx tsx --test lib/public-design-system.test.ts lib/page-view-path.test.ts`: passed (5 tests)
- `npm run codex:verify`: passed on this branch (Prisma generation, production compilation, type validation, page generation, and build traces)
- Documentation checks: relocated guidance paragraphs preserved and local links resolve; git diff --check passed.
- Browser visual/interaction and runtime auth smoke checks remain unverified: the available browser and local HTTP client could not reach the local preview server. Static specimen rendering succeeded; route guards use the existing requireCapability implementation.

## Deploy Notes

- Migrations: none
- Environment variables: none
- Data/backfill/release steps: none
- Queue/deploy trigger: queued until the next requested or major deployment

## Risk And Conflicts

- Shared areas touched: AGENTS.md; docs/design-system.md and docs/design-system/ topic files; docs/design/themes.md; app/admin/site/layout.tsx; styles/globals.css and styles/tokens.css; package.json scripts; lib/page-view-path.ts and lib/telemetry-client.ts. New routes/components/registry/tests/generator are scoped to the showcase.
- Expected conflicts: docs/design-system.md consolidation can conflict with concurrent museum guidance edits. Preserve newer curator decisions in their corresponding topic file rather than restoring the monolith. Shared CSS/token and admin navigation changes may require reconciliation.
- Branch ancestry includes the separately queued saint profile typography commits 55bee7f/a938aa8; avoid duplicating an already integrated handoff or reverting its deployed changes.
- Review after integration: authorized Site tab/preview at wide and narrow widths, denied direct preview access, keyboard disclosure behavior, and absence of sample analytics. Preview content uses invented fixtures; root header/footer retain normal published configuration and real contact behavior.
- Rollback notes: revert showcase commits cd4f655, 78bd13d, and 3bea1ae with their handoff; retain separately released saint typography refinements.

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
