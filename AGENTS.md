# Project rules for AI agents

This is a production MVP for the Hindu Saints Website.

Architecture:
- Use Next.js App Router, TypeScript, PostgreSQL, Prisma, and Docker.
- The app includes both public pages and a custom protected admin CMS.
- Do not use Airtable as the live website source of truth.
- Airtable is import/reference only.
- Do not introduce Directus, Payload, Sanity, or another CMS unless explicitly requested.

Public content:
- Public pages show only published content.
- Never expose museum/relic fields publicly.
- Saint pages must use shared templates and components.
- Missing data must be handled gracefully.

Admin/CMS:
- Build domain-specific admin workflows for saints, aliases, traditions, biographies, sources, Instagram items, and reconciliation.
- Contributors can draft and preview.
- Editors/admins can publish.
- Preview routes must require auth and be noindexed.

Design system:
- Use design tokens for colors, fonts, spacing, shadows, radii, widths, and image treatments.
- All design and layout changes must go through the design system first: tokens, shared CSS classes, shared configuration, or reusable components.
- Before changing admin review/detail UX, read `docs/design-system.md`, especially "Admin review UX direction" and "Detail-page review model".
- Do not hard-code colors, fonts, spacing, shadows, radii, widths, or image treatments in components.
- Do not add one-off inline styles or page-specific layout wrappers unless the pattern is genuinely unique and explicitly justified.
- If a visual or layout pattern appears in more than one place, promote it into `styles/tokens.css`, `styles/globals.css`, shared configuration, or a reusable component.
- Theme-specific changes must use theme tokens instead of conditional component logic.
- Reuse existing UI components before creating new ones.

Security:
- Do not expose secrets in client code.
- Validate server-side form inputs.
- Sanitize Markdown rendering.
- Protect all admin routes.

Verification:
- Use `npm run dev:check` for the normal development loop after TypeScript, component, route, or data-contract edits.
- `npm run dev:check` generates the Prisma client and runs TypeScript without doing a production Next.js build.
- `npm run build` is the web build only. Do not add database migrations, seeds, or other database access to the web build path.
- Keep database imports build-safe: modules may import `@/lib/db`, but Prisma must not connect or require `DATABASE_URL` at module import time. Initialize the client lazily when query code actually uses `db`.
- Prisma client generation is code generation, not database access. Keep it explicit in `dev:check`, `db:generate`, Docker build setup, and `codex:verify`.
- Use `npm run codex:verify` only as a heavier gate: after dependency/setup changes, before handing off a large route/rendering change, before commits intended for deployment, or when a production-build failure is specifically suspected.
- Do not run `npm run codex:verify` as the default checker for every small frontend iteration.
- Production database migrations must run in the deployment migrate/release phase, not while building the web image.
- Do not run database migrations against production from Codex Cloud.
- Cloud tasks that need database access must use a development PostgreSQL database configured through environment settings.
- If `CODEX_START_POSTGRES=1` and Docker is available in Codex Cloud, use `scripts/start-dev-postgres.sh` to run a disposable local Postgres 16 container for development tasks.

Data ingestion and reconciliation:
- "Import" means bringing external content records into the website database from Airtable exports, Instagram exports/scrapes, CSV files, or other editorial data sources.
- Preserve raw external Airtable, Instagram, CSV, and manual-ingest values for review and debugging.
- Create reconciliation issues when external content conflicts with reviewed website content.
- Do not silently overwrite human CMS edits with later Airtable, Instagram, CSV, or script-ingested data.

Commit workflow:
- Multiple agents may work in this repository at the same time, so commits must be intentionally scoped.
- On this Windows/Codex setup, Git commands that write repository metadata may need to run elevated/outside the sandbox because `.git` can be write-protected for the sandbox user.
- It is acceptable to request/run elevated Git commands for normal repository operations such as `remote`, `fetch`, `pull`, `status`, `add`, `commit`, `push`, `log`, and `branch` when sandbox permissions block them.
- Elevated Git commands must still follow the scoped commit rules below and must not be used for destructive operations such as `reset --hard`, broad checkout/revert, or deleting branches unless explicitly requested.
- Before committing, inspect the working tree and identify only the files changed for the current task.
- Commit with one atomic command that resets the staged area, stages only the intended paths, and creates the commit.
- Do not use broad `git add .` or `git add -A` unless the current task genuinely owns every changed file.
- Do not commit unrelated changes made by users or other agents.
- Preferred shape:

```sh
git restore --staged :/ && git add path/to/file-a path/to/file-b && git commit -m "Short commit message"
```

- For multi-line commit messages, use the shell-appropriate equivalent of a single atomic command that includes unstaging, targeted staging, and committing together.
