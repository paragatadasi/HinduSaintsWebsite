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
- Build domain-specific admin workflows for saints, aliases, sampradayas, biographies, sources, Instagram items, and reconciliation.
- Contributors can draft and preview.
- Editors/admins can publish.
- Preview routes must require auth and be noindexed.

Design system:
- Use design tokens for colors, fonts, spacing, shadows, radii, widths, and image treatments.
- Do not hard-code colors or fonts in components.
- Reuse existing UI components before creating new ones.

Security:
- Do not expose secrets in client code.
- Validate server-side form inputs.
- Sanitize Markdown rendering.
- Protect all admin routes.

Verification:
- After dependency setup, use `npm run codex:verify` for Codex Cloud validation.
- Do not run database migrations against production from Codex Cloud.
- Cloud tasks that need database access must use a development PostgreSQL database configured through environment settings.

Data ingestion and reconciliation:
- "Import" means bringing external content records into the website database from Airtable exports, Instagram exports/scrapes, CSV files, or other editorial data sources.
- Preserve raw external Airtable, Instagram, CSV, and manual-ingest values for review and debugging.
- Create reconciliation issues when external content conflicts with reviewed website content.
- Do not silently overwrite human CMS edits with later Airtable, Instagram, CSV, or script-ingested data.

Commit workflow:
- Multiple agents may work in this repository at the same time, so commits must be intentionally scoped.
- Before committing, inspect the working tree and identify only the files changed for the current task.
- Commit with one atomic command that resets the staged area, stages only the intended paths, and creates the commit.
- Do not use broad `git add .` or `git add -A` unless the current task genuinely owns every changed file.
- Do not commit unrelated changes made by users or other agents.
- Preferred shape:

```sh
git restore --staged :/ && git add path/to/file-a path/to/file-b && git commit -m "Short commit message"
```

- For multi-line commit messages, use the shell-appropriate equivalent of a single atomic command that includes unstaging, targeted staging, and committing together.
