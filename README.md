# Hindu Saints Website

A devotional, searchable, source-backed archive for the `@hindu_saints` project. The MVP is a Dockerized Next.js App Router application with PostgreSQL, Prisma, and a narrow custom admin CMS for saints, biographies, traditions, Instagram mapping, and reconciliation.

## New computer setup

1. Install Node.js LTS from <https://nodejs.org/>.
2. Install Docker Desktop from <https://www.docker.com/products/docker-desktop/>.
3. Restart your terminal after installing both.
4. Copy `.env.example` to `.env` and update secrets.
5. Install packages:

```powershell
npm install
```

6. Start PostgreSQL with Docker:

```powershell
docker compose -f infra/docker-compose.yml up -d postgres
```

7. Generate Prisma and run migrations:

```powershell
npm run db:generate
npm run db:migrate
npm run db:seed
```

8. Start the development server:

```powershell
npm run dev
```

Then open <http://localhost:3000>.

## Important routes

- `/` public home
- `/about` public about page
- `/saints` public saints index
- `/saints/[slug]` public saint pages
- `/traditions` public traditions index
- `/admin` protected CMS dashboard
- `/admin/media` protected media upload workflow
- `/media/[...key]` public delivery for uploaded media assets
- `/admin/instagram` reconciliation queue

## Local image hosting

Local media uploads are stored on disk under `MEDIA_UPLOAD_ROOT`, which defaults to `./uploads`. Uploaded image metadata is recorded in the `MediaAsset` table, while public reads are served through `/media/[...key]`.

Supported local upload formats are JPEG, PNG, WebP, and GIF. The default upload size limit is 5 MB through `MEDIA_UPLOAD_MAX_BYTES`.

For local-only development without OAuth configured, set `MEDIA_UPLOADS_REQUIRE_AUTH="false"` in `.env`. Keep it enabled anywhere the site is reachable by other users.

## Codex Cloud

See `docs/codex-cloud.md` for the hosted Codex environment setup script, environment variables, and verification command.

## Development checks

Use the lightweight checker during ordinary frontend and TypeScript work:

```powershell
npm run dev:check
```

Use `npm run codex:verify` only when you need the production-build gate, such as dependency/setup changes, large route/rendering changes, pre-deployment handoff, or suspected build-only failures.

## Project principles

- Public pages only show published content.
- Museum and relic fields must never be public.
- Airtable is import/reference only.
- Volunteers edit content through the custom CMS, not source code.
- Long biographies are Markdown, rendered safely.
