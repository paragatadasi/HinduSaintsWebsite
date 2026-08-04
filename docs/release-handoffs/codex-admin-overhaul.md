# Release Handoff: codex/admin-overhaul

- Status: ready
- Branch: `codex/admin-overhaul`
- Commit: `87d5c5a54a1404a8facd4055c20c9e1f8ab2d906`
- Owner/agent: `aporu`

## Summary

- Adds additive Site Admin, Data Admin, Editor, Contributor, Curator, and Translator roles backed by centralized capabilities.
- Adds database-backed Users & Access management with final-admin and self-demotion safeguards.
- Reorganizes the admin navigation into Operations, Source Data, Content, and a top-level Museum destination.
- Separates Instagram ingestion from editorial Instagram review and protects source-data routes, APIs, and admin mutations.
- Grandfathers the configured allowlist into Site Admin records only when the database has no active Site Admin.

## Verification

- `npm run dev:check`: passed
- `npm run codex:verify`: application compilation, type validation, page-data collection, and static generation passed; Windows standalone trace-copy exceeded the command time limit in the isolated worktree.

## Deploy Notes

- Migrations: `20260804120000_additive_admin_roles` replaces the single `User.role` enum with additive `User.roles`, adds Curator/Translator/Data Admin/Site Admin values, and adds `User.active`.
- Environment variables: none
- Data/backfill/release steps: deploy the migration before serving the new application. On first sign-in after migration, if there is no active Site Admin, every email in `ADMIN_EMAIL_ALLOWLIST` is persisted as an active Site Admin; subsequent access is database-backed.

## Risk And Conflicts

- Shared areas touched: Prisma `User` schema, NextAuth configuration, admin navigation/layout, admin global styles, content actions, import APIs.
- Expected conflicts: possible conflicts with branches changing `styles/globals.css`, `app/admin/layout.tsx`, `lib/auth.ts`, or `prisma/schema.prisma`. Integrate after newer schema/auth work and re-run the production build.
- Rollback notes: revert `87d5c5a` and any dependent release commits

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
