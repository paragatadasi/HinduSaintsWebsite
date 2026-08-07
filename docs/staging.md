# Staging deployment

The staging site is published at `https://staging.hindusaints.org`. It is a
long-lived test environment for changes before they move to `main` and the
production-only `deploy` branch.

## Safety boundaries

Staging must use resources that cannot write to production:

- a separate PostgreSQL database, database user, password, and persistent volume;
- a separate media bucket or bucket prefix with staging-only write credentials;
- a separate `AUTH_SECRET` and session store;
- `NEXTAUTH_URL` and `PUBLIC_SITE_URL` set to
  `https://staging.hindusaints.org`;
- `SITE_ENVIRONMENT=staging`, which blocks crawler indexing through both
  `robots.txt` and the `X-Robots-Tag` response header;
- staging-specific cron and integration secrets, with scheduled external imports
  disabled unless the staging behavior itself is being tested.

Do not point staging at the production database or give staging credentials
write access to production media. A content snapshot may be restored into the
staging database after removing accounts, sessions, feedback, tokens, and other
private or operational records.

## Release flow

1. For a shared integration test, merge or cherry-pick the changes into the
   `staging` branch and push it. To test one feature branch, run **Dispatch
   Staging Deploy** manually in GitHub Actions and select that branch.
2. The public workflow records a `staging` deployment and dispatches the private
   `deploy-hindu-saints-staging.yml` workflow for the exact selected commit.
3. Verify the health endpoint, public pages, sign-in, admin workflows, media,
   and the `noindex` response header at `https://staging.hindusaints.org`.
4. After approval, integrate the tested feature branch into `main` through the
   normal release-captain flow. Production still deploys only when `main` is
   merged into `deploy`.

The staging branch is a deployment target, not a source branch. New work should
continue on short-lived `codex/...` branches.

## Private infrastructure requirements

Host-specific files remain in the private BMIT engineering repository. Add a
`deploy-hindu-saints-staging.yml` workflow there with the same dispatch inputs
as production (`source_repo`, `source_ref`, `target_sha`, `deployment_id`, and
`force`). It should:

1. check out and verify the requested app commit;
2. build a distinct staging image;
3. run Prisma migrations against only the staging database;
4. deploy the staging app, database, and media configuration without changing
   production services or volumes;
5. wait for `https://staging.hindusaints.org/api/health` to return success;
6. verify that a page response includes
   `X-Robots-Tag: noindex, nofollow, noarchive`;
7. report the final GitHub Deployment status and environment URL.

Configure the private reverse proxy for `staging.hindusaints.org`, create the
corresponding DNS record, and restrict access at the proxy or identity layer to
the editorial team. The health check used by deployment automation must remain
available to that automation. Keep host addresses, credentials, private Compose
files, and DNS-provider details out of this public repository.
