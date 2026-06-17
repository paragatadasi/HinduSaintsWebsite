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

## VPS notes

1. Install Docker and Docker Compose.
2. Copy the project to the server.
3. Set real production secrets in `.env`.
4. Set `CADDY_DOMAIN` to the domain.
5. Start the stack.
6. Confirm HTTPS and admin access.

## Backups

The backup service runs `scripts/backup-db.sh` once per day and stores SQL dumps in `backups/`. Restore with:

```powershell
docker compose -f infra/docker-compose.yml exec -T postgres psql "$env:DATABASE_URL" < backups\saints-YYYYMMDD-HHMMSS.sql
```

If local media storage is used, back up the uploads volume as well.
