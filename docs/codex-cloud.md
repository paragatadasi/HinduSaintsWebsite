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
npm install
npx prisma generate
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

## Verification command

Ask Codex Cloud agents to run:

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
