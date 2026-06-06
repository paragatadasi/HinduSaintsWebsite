# Codex Cloud setup

Codex Cloud creates a hosted container, checks out the selected repo branch, runs the environment setup script, then lets the agent work inside that prepared container.

## Recommended environment

In Codex environment settings:

1. Create an environment for this repository.
2. Use the default universal image.
3. Pin Node.js to the current LTS version if the UI offers package version settings.
4. Add the setup script below.
5. Add environment variables from `.env.codex.example`.
6. Keep secrets in the Codex environment settings, not in git.

Setup script:

```bash
bash scripts/codex-cloud-setup.sh
```

Maintenance script:

```bash
bash scripts/codex-cloud-setup.sh
```

## Environment variables

Required for most cloud coding tasks:

- `DATABASE_URL`
- `AUTH_SECRET`
- `NEXTAUTH_URL`
- `PUBLIC_SITE_URL`

Optional until auth is fully enabled:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `ADMIN_EMAIL_ALLOWLIST`

For ordinary UI and component work, `DATABASE_URL` can point to a disposable development Postgres database. For import, CMS, and migration tasks, point it at a real development database, never production.

## Local Postgres inside Codex Cloud

If the Codex Cloud environment has Docker available, set:

```bash
CODEX_START_POSTGRES=1
DATABASE_URL=postgresql://saints_dev:saints_dev_password_2026@localhost:5432/hindu_saints_dev?schema=public
POSTGRES_DB=hindu_saints_dev
POSTGRES_USER=saints_dev
POSTGRES_PASSWORD=saints_dev_password_2026
```

The setup script will run:

```bash
bash scripts/start-dev-postgres.sh
```

This starts an idempotent `postgres:16` container named `hindu-saints-dev-postgres` and waits until it is ready. Use this only for disposable development data in Codex Cloud.

If Docker is unavailable in the selected cloud environment, disable `CODEX_START_POSTGRES` and set `DATABASE_URL` to an external development Postgres database.

## Development checks

For ordinary UI, component, route, and data-contract work, ask agents to run the lightweight checker:

```bash
npm run dev:check
```

This generates the Prisma client and runs TypeScript without doing a production Next.js build.

## Production verification

Ask Codex Cloud agents to run the heavier production-build gate only after dependency/setup changes, before handing off a large route/rendering change, before deployment-oriented commits, or when a production-build failure is specifically suspected:

```bash
npm run codex:verify
```

This generates the Prisma client and builds the Next.js app. It does not run migrations or seed the database.

## Database notes

The production architecture uses PostgreSQL. Do not switch Prisma to SQLite just to make cloud tasks easier. If a cloud task needs database access, configure a development Postgres connection in the environment settings.

## Internet access

Codex setup scripts have internet access so dependencies can install. During the agent phase, internet access may be disabled depending on environment settings. Keep routine tasks buildable without live network access after setup.

## Commit safety

This repository expects multiple agents to work at the same time. Cloud agents must follow the commit workflow in `AGENTS.md`: inspect the working tree, stage only task-owned files, and commit with one atomic command.
