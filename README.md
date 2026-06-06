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
- `/saints` public saints index
- `/saints/[slug]` public saint pages
- `/sampradayas` public sampradaya index
- `/admin` protected CMS dashboard
- `/admin/instagram` reconciliation queue

## Codex Cloud

See `docs/codex-cloud.md` for the hosted Codex environment setup script, environment variables, and verification command.

## Project principles

- Public pages only show published content.
- Museum and relic fields must never be public.
- Airtable is import/reference only.
- Volunteers edit content through the custom CMS, not source code.
- Long biographies are Markdown, rendered safely.
