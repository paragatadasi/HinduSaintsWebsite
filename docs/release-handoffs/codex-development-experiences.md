# Release Handoff: codex/development-experiences

- Status: queued
- Branch: `codex/development-experiences`
- Commit: `ea9e33205262e2dbb33f6481b234ad629e1e41a1`
- Owner/agent: `aporu`
- Bundle priority: queue for next major/bundled deployment

## Summary

- Adds database-backed development-experience visibility with `off`,
  `admin_preview`, and `public` states managed from Admin.
- Adds the view-only Tester role. Site Admins and Editors can manage preview
  states; Site Admins, Editors, and Testers can view enabled previews.
- Protects admin, Museum Admin, and preview surfaces with authenticated route
  guards, true 404 responses for unauthorized previews, noindex metadata,
  `X-Robots-Tag`, and private/no-store response policies.
- Removes the superseded staging-environment implementation and documents the
  production CDN requirement for authenticated public-page previews.

## Verification

- `npm run dev:check`: passed
- `npm test`: passed, 152 tests
- `npm run codex:verify`: passed during implementation with a local worktree
  workaround for standalone packaging; release captain should run the normal
  integrated production gate because this branch changes schema, auth, routing,
  middleware, and Next.js configuration.
- Runtime checks: anonymous `/preview/*` returned a true 404 with private,
  no-store, and noindex headers; authenticated public responses were also
  private, no-store, and noindex.

## Deploy Notes

- Migrations: `20260812120000_development_experiences` adds the `tester`
  `UserRole`, `DevelopmentExperienceStatus`, and `DevelopmentExperience` table.
- Environment variables: none
- Data/backfill/release steps: run the migration in the normal release/migrate
  phase before starting the new web image. No backfill is required; registered
  experiences default to `off`. Ensure the production CDN bypasses shared cache
  whenever an Auth.js session cookie is present before enabling previews on
  otherwise cacheable public URLs.
- Queue/deploy trigger: queued until the next requested or major deployment

## Risk And Conflicts

- Shared areas touched: Prisma role/schema and migration, admin permissions and
  navigation, `/preview` routing, request middleware, `next.config.ts`, robots
  configuration, and deployment documentation.
- Expected conflicts: branches that also change `UserRole`, permissions,
  `prisma/schema.prisma`, `next.config.ts`, admin navigation, or middleware may
  require manual integration.
- Rollback notes: turn all development experiences `off` first, then revert
  `ea9e332` and any dependent release commits. The additive enum/table migration
  can remain in place during an application rollback; remove it only through a
  separately reviewed forward migration if required.

## Release Captain Notes

- Integrated into `main`: pending
- Pushed to `main`: no
- Merged to `deploy`: pending
- Production workflow: pending
