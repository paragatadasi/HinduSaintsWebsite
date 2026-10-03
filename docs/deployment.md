# Deployment

## Local Docker

Copy `.env.example` to `.env`, then start PostgreSQL:

```powershell
docker compose -f infra/docker-compose.yml up -d postgres
```

Alternatively, start just the development Postgres container with:

```powershell
bash scripts/start-dev-postgres.sh
```

Run migrations and seeds:

```powershell
npm run db:migrate
npm run db:seed
```

## Full stack

```powershell
docker compose -f infra/docker-compose.yml up -d --build
```

For a local Windows production build outside Docker, use the wrapper that stops
workspace dev processes before running the normal build:

```powershell
npm run build:local
```

## Production deployment

Production deployment details are intentionally not stored in this public app repository.
Do not add Strato host details, Caddy production routing, production Compose files,
SSH keys, private deploy scripts, backup destinations, or real environment values
here.

Private production deployment details live in the local BMIT engineering checkout:

```text
../bmit-eng/deploy/hindu-saints/prod.md
```

That private deploy area owns the Strato runbook, production Compose file,
deploy scripts, backup scripts, and production GitHub Actions workflow. This
public repo may keep generic app requirements only, such as the `Dockerfile`,
health endpoint, Prisma migrations, and local-development Docker setup.

Production releases are made by moving the public `deploy` branch. The public
workflow delegates to `scripts/deploy/dispatch-production-deploy.sh`, which
creates a GitHub Deployment record for the pushed commit and dispatches the
private `bmit-eng` workflow. The private workflow performs the Strato deploy and
writes the final deployment status back to this repository.

## Backups

The local Compose backup service runs `scripts/backup-db.sh` once per day and
stores SQL dumps in `backups/`, with 14-day retention. This does not establish
that production uses the same schedule or destination. Production backups must
be located and checked using the private engineering runbook mentioned above.

Before cleanup, identify the newest successful production dump and confirm its
database and timestamp. A fresh pre-cleanup dump preserves the current state;
a pre-import dump is useful for comparison but restoring it wholesale would
also roll back later editorial work. Check backup job logs and the actual file,
then test a restore into a separate disposable database. Verify the restored
schema and representative saints/import records before treating it as recoverable.
Never test recovery by overwriting the live database. Back up local uploads too
if media is stored on disk.

The local plain-SQL restore command is:

```powershell
docker compose -f infra/docker-compose.yml exec -T postgres psql "$env:DATABASE_URL" < backups\saints-YYYYMMDD-HHMMSS.sql
```

If local media storage is used, back up the uploads volume as well.

## Production media storage

Production can serve uploaded and imported images directly from Amazon S3,
Cloudflare R2, or another S3-compatible object store. Configure the
`MEDIA_STORAGE_BACKEND`, `MEDIA_PUBLIC_BASE_URL`, and `MEDIA_S3_*` environment
variables documented in `.env.example`. The bucket or custom media domain must
allow public reads through `MEDIA_PUBLIC_BASE_URL`; write credentials remain
server-only.

New uploads generate responsive WebP variants and store their URLs in the
database. Existing filesystem media can be migrated in two stages:

```powershell
npm run media:migrate-object-storage -- --limit=25
npm run media:migrate-object-storage -- --apply
```

The first command is a dry run. Back up the database and uploads volume before
running the apply command in production. Keep the filesystem backup until the
site has been verified against the object-storage URLs.

Public pages advertise a five-minute shared-cache lifetime with one day of
stale-while-revalidate through `Cache-Control`, `CDN-Cache-Control`, and
`Surrogate-Control`. Configure the production CDN to respect the header it
supports, preserve Next.js response variation headers, and include the full
query string in the cache key.
