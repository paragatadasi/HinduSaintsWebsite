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

Local `npm run dev` runs `prisma migrate deploy` and `prisma generate`
before starting Next. This keeps the development database aligned when new
checked-in migrations are pulled or created by another agent. Use
`npm run db:migrate` only when intentionally creating a new migration from a
Prisma schema change.

This project uses Prisma ORM 7. Prisma configuration lives in
`prisma.config.ts`, including the datasource URL, migrations path, and seed
command. The generated Prisma client is emitted to `lib/generated/prisma` and
is intentionally gitignored; application code imports from
`@/lib/generated/prisma/client`, while `lib/db.ts` creates the client with the
PostgreSQL driver adapter.

On Windows, Prisma may fail to regenerate the query engine with `EPERM` if a
hidden Next/Node process is still holding the Prisma DLL. Use the reset command
to stop local dev processes on ports 3000-3003 and any Node process launched
from this workspace before starting Next again:

```powershell
npm run dev:reset
```

## Local admin sign-in

The admin CMS at `/admin` uses Google OAuth through Auth.js/NextAuth and then checks the signed-in email against `ADMIN_EMAIL_ALLOWLIST`.

For local development, create a Google OAuth web client and add:

- Authorized JavaScript origin: `http://localhost:3000`
- Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`

Then set these values in `.env`:

```env
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
ADMIN_EMAIL_ALLOWLIST="admin@example.com,editor@example.com"
```

Auth.js-style names `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` are also accepted by the app, but `.env.example` uses the `GOOGLE_*` names.

Restart `npm run dev` after changing these variables. If Google shows `Missing required parameter: client_id`, the running server does not have a Google client ID loaded. If the admin page disables the Google button and says sign-in needs a client ID and secret, fill in the Google OAuth values and restart the dev server.

## Important routes

- `/` public home
- `/about` public about page
- `/saints` public saints index
- `/saints/[slug]` public saint pages
- `/traditions` public traditions index
- `/map` public map of India and place index
- `/places/[slug]` public place detail pages
- `/admin` protected CMS dashboard
- `/admin/media` protected media upload workflow
- `/media/[...key]` public delivery for uploaded media assets
- `/admin/instagram` reconciliation queue

## Local image hosting

Local media uploads are stored on disk under `MEDIA_UPLOAD_ROOT`, which defaults to `./uploads`. Uploaded image metadata is recorded in the `MediaAsset` table, while public reads are served through `/media/[...key]`.

Supported local upload formats are JPEG, PNG, WebP, and GIF. The default upload size limit is 5 MB through `MEDIA_UPLOAD_MAX_BYTES`.

For local-only development without OAuth configured, set `MEDIA_UPLOADS_REQUIRE_AUTH="false"` in `.env`. Keep it enabled anywhere the site is reachable by other users.

Saint review pages can upload local images or select imported Instagram post images as crop sources. Approved crops create `MediaAsset` records and can be attached as primary images, gallery images, or both. Gallery attachments use `SaintGalleryImage.publicVisible` so editors can hide images from public pages while keeping them in the saint review staging area; staged images can be restored or deleted after confirmation.

## Codex Cloud

See `docs/codex-cloud.md` for the hosted Codex environment setup script, environment variables, and verification command.

## Data integrations

See `docs/data-integrations.md` for the current Airtable mirror, Instagram API
ingest, CMS saint import, public rendering, and admin review workflow status.

Existing Instagram carousel records can refresh their child image URLs with:

```powershell
npm run backfill:instagram-carousels
```

Quick local Airtable import sequence:

```sh
npm run import:airtable -- --dry-run
npm run import:airtable
npm run import:airtable-saints
npm run import:airtable-saints -- --write
```

Requires `AIRTABLE_ACCESS_TOKEN`, `AIRTABLE_BASE_ID`, and
`AIRTABLE_TABLES="Saints"`.

See `docs/map-and-places.md` for the public Map page, Places detail routes,
geocoding fallback, timeline filter, and place data workflow.

## Development checks

Use the lightweight checker during ordinary frontend and TypeScript work:

```powershell
npm run dev:check
```

When a database migration already exists and needs to be applied without
creating a new migration, run:

```powershell
npm run db:deploy
```

Use `npm run codex:verify` only when you need the production-build gate, such as dependency/setup changes, large route/rendering changes, pre-deployment handoff, or suspected build-only failures.

## Project principles

- Public pages only show published content.
- Museum and relic fields must never be public.
- Airtable is import/reference only.
- Volunteers edit content through the custom CMS, not source code.
- Long biographies are Markdown, rendered safely.
