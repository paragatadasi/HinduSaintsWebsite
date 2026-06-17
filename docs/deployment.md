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

The backup service runs `scripts/backup-db.sh` once per day and stores SQL dumps in `backups/`. Restore with:

```powershell
docker compose -f infra/docker-compose.yml exec -T postgres psql "$env:DATABASE_URL" < backups\saints-YYYYMMDD-HHMMSS.sql
```

If local media storage is used, back up the uploads volume as well.
